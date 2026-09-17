'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Star,
  Users,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Heart,
  Car,
  Wind,
  ChefHat,
  Music,
  Bed,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';

const VenueMap = dynamic(() => import('@/components/VenueMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 sm:h-80 rounded-2xl bg-stone-100 flex items-center justify-center text-xs text-stone-500 animate-pulse">
      Loading interactive venue map...
    </div>
  ),
});

export default function HallDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const hallId = params.id as string;

  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking & Pricing state
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('23:00');
  const [guestCount, setGuestCount] = useState<number>(300);
  const [cateringType, setCateringType] = useState<'NONE' | 'VEG' | 'NON_VEG'>('VEG');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Calculated Pricing Breakdown
  const [pricingBreakdown, setPricingBreakdown] = useState<any>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  // Availability status
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    checked: boolean;
    available: boolean;
    conflictReason?: string;
  }>({ checked: false, available: true });

  // Fetch hall details
  useEffect(() => {
    async function fetchHall() {
      setLoading(true);
      try {
        const res = await fetch(`/api/halls/${hallId}`);
        if (!res.ok) throw new Error('Venue not found');
        const data = await res.json();
        setHall(data.hall);

        // Pre-select first approved occasion
        if (data.hall.occasions?.length > 0) {
          setSelectedOccasionId(data.hall.occasions[0].occasion.id);
        }
        // Pre-set default guest count within capacity
        if (data.hall.minCapacity) {
          setGuestCount(Math.max(data.hall.minCapacity, Math.min(300, data.hall.maxCapacity)));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHall();
  }, [hallId]);

  // Set default date (e.g. 1 month in future)
  useEffect(() => {
    if (!eventDate) {
      const future = new Date();
      future.setDate(future.getDate() + 30);
      setEventDate(future.toISOString().split('T')[0]);
    }
  }, []);

  // Recalculate price and availability when parameters change
  useEffect(() => {
    if (!hall || !eventDate || !guestCount) return;

    let isCancelled = false;

    async function updatePriceAndSlot() {
      setCalculatingPrice(true);
      try {
        // 1. Authoritative price calculation
        const priceRes = await fetch(`/api/halls/${hall.id}/calculate-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventDate,
            startTime,
            endTime,
            guestCount,
            cateringType,
            selectedAddonIds,
          }),
        });
        if (priceRes.ok && !isCancelled) {
          const pData = await priceRes.json();
          setPricingBreakdown(pData.pricing);
        }

        // 2. Check slot availability
        const availRes = await fetch(
          `/api/halls/${hall.id}/availability?date=${eventDate}&startTime=${startTime}&endTime=${endTime}`
        );
        if (availRes.ok && !isCancelled) {
          const aData = await availRes.json();
          setAvailabilityStatus({
            checked: true,
            available: aData.isAvailable,
            conflictReason: aData.conflictReason,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!isCancelled) setCalculatingPrice(false);
      }
    }

    updatePriceAndSlot();
    return () => {
      isCancelled = true;
    };
  }, [hall, eventDate, startTime, endTime, guestCount, cateringType, selectedAddonIds]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleProceedBooking = () => {
    if (!availabilityStatus.available) return;

    // Navigate to checkout with pre-selected parameters
    const params = new URLSearchParams({
      occasionId: selectedOccasionId,
      date: eventDate,
      startTime,
      endTime,
      guests: guestCount.toString(),
      catering: cateringType,
      addons: selectedAddonIds.join(','),
    });

    router.push(`/booking/${hall.id}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-stone-600">Loading venue details...</p>
      </div>
    );
  }

  if (error || !hall) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900">Venue Not Available</h2>
        <p className="text-xs text-stone-500">The requested venue could not be found or is not currently active.</p>
        <Link href="/search" className="inline-block px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl shadow">
          Browse Active Venues
        </Link>
      </div>
    );
  }

  const mediaList = hall.media || [];
  const currentImage = mediaList[activeImageIndex]?.url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-28 lg:pb-8">
      {/* Title & Location Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider">
              {hall.city?.name}
            </span>
            {hall.isFeatured && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-900 font-black text-[10px] uppercase tracking-wider">
                Featured Partner
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Verified Venue</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            {hall.name}
          </h1>

          <p className="text-xs text-stone-600 flex items-center gap-1.5 pt-1">
            <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{hall.address}, {hall.locality?.name}, {hall.city?.name}</span>
          </p>
        </div>

        {/* Rating Summary Card */}
        <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-2xl p-3 shadow-sm shrink-0">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-stone-900 flex flex-col items-center justify-center font-black">
            <span className="text-base leading-none">{hall.averageRating}</span>
            <Star className="w-3 h-3 fill-stone-900" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-900">Verified Rating</p>
            <p className="text-[11px] text-stone-600">{hall.reviewCount} verified guest reviews</p>
          </div>
        </div>
      </div>

      {/* Gallery Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Main large display */}
        <div className="lg:col-span-3 h-72 sm:h-96 md:h-[480px] rounded-2xl overflow-hidden relative shadow-md bg-stone-100">
          <img
            src={currentImage}
            alt={hall.name}
            className="w-full h-full object-cover transition duration-300"
          />
          {mediaList[activeImageIndex]?.caption && (
            <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs text-white">
              {mediaList[activeImageIndex].caption}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        <div className="lg:col-span-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:h-[480px] pr-1 pb-1">
          {mediaList.map((m: any, idx: number) => (
            <button
              key={m.id || idx}
              onClick={() => setActiveImageIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
              className={`relative h-20 sm:h-24 lg:h-28 w-28 sm:w-32 lg:w-full rounded-xl overflow-hidden shrink-0 border-2 transition ${
                activeImageIndex === idx
                  ? 'border-amber-600 shadow-md ring-2 ring-amber-400/40'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={m.url} alt={m.caption || hall.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Details & Left Content vs Right Authoritative Booking Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Venue Details, Amenities, Approved Occasions, Policies, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Specifications Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-stone-200 rounded-2xl p-4 shadow-sm text-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-stone-600">Guest Capacity</p>
              <p className="text-sm font-extrabold text-stone-900 mt-0.5">
                {hall.minCapacity} – {hall.maxCapacity}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-stone-600">Indoor Hall Area</p>
              <p className="text-sm font-extrabold text-stone-900 mt-0.5">
                {hall.indoorAreaSqFt ? `${hall.indoorAreaSqFt.toLocaleString()} sq.ft` : 'Spacious Hall'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-stone-600">Parking</p>
              <p className="text-sm font-extrabold text-stone-900 mt-0.5">
                {hall.hasParking ? `${hall.parkingCapacity || 100}+ Cars` : 'Street Only'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-stone-600">Rooms Included</p>
              <p className="text-sm font-extrabold text-stone-900 mt-0.5">
                {hall.roomsCount} Bridal Suites
              </p>
            </div>
          </div>

          {/* About Description */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-stone-900">About the Venue</h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
              {hall.description}
            </p>
          </div>

          {/* Approved Occasions Supported */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">Approved Celebrations & Occasions</h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Admin Authorized Only
              </span>
            </div>
            <p className="text-xs text-stone-500">
              This venue is certified and licensed to host the following specific event types:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {hall.occasions?.map((ho: any) => (
                <span
                  key={ho.occasion.id}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{ho.occasion.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Amenities & Facilities */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-stone-900">Venue Amenities & Facilities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {hall.amenities?.map((ha: any) => (
                <div
                  key={ha.amenity.id}
                  className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-2.5 text-xs text-stone-800"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-semibold">{ha.amenity.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Policies & Rules */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-stone-900">Policies & Venue Guidelines</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
                <p className="font-bold text-stone-900">Cancellation & Refund Policy</p>
                <p className="text-stone-600">
                  Cancel up to <strong className="text-stone-900">{hall.cancellationDeadlineHours || 72} hours</strong> prior for an automated <strong className="text-emerald-700">{hall.refundPercentage || 80}% refund</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
                <p className="font-bold text-stone-900">Catering & Food Policy</p>
                <p className="text-stone-600">
                  {hall.outsideCateringAllowed
                    ? 'Outside catering teams permitted with prior clearance.'
                    : 'Exclusive in-house five-star gourmet catering team.'}
                </p>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
                <p className="font-bold text-stone-900">Decoration Policy</p>
                <p className="text-stone-600">
                  {hall.outsideDecorAllowed
                    ? 'Outside decorators permitted with manager guidelines.'
                    : 'In-house decor specialists available with customized packages.'}
                </p>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
                <p className="font-bold text-stone-900">Alcohol & Beverage Rules</p>
                <p className="text-stone-600">
                  {hall.alcoholAllowed
                    ? 'Alcohol permitted with valid one-day event permit.'
                    : 'Strictly non-alcoholic venue.'}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Venue Map */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">Venue Location & Neighborhood</h2>
                <p className="text-xs text-stone-500">{hall.address}, {hall.city?.name}</p>
              </div>
              <MapPin className="w-5 h-5 text-amber-700 shrink-0" />
            </div>
            <VenueMap
              latitude={hall.latitude}
              longitude={hall.longitude}
              venueName={hall.name}
              address={hall.address}
              city={hall.city?.name}
            />
          </div>

          {/* No Surprise Charges Guarantee Card */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
              <span>No Surprise Charges Guarantee</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed">
              At Utsav Venues, all quoted rates include full transparency. Your final total incorporates base rental, weekend prime surcharges (if applicable), guest catering allowances, requested add-ons, and statutory 18% GST. No unexpected on-the-day electrical surcharges or hidden gate fees.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-bold text-amber-900">
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60 text-center">
                <span>✓ 100% Itemized</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60 text-center">
                <span>✓ Concurrency Locked</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60 text-center">
                <span>✓ GST Tax Invoiced</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60 text-center">
                <span>✓ Free Cancellation</span>
              </div>
            </div>
          </div>

          {/* Verified Customer Reviews */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">Verified Guest Reviews</h2>
                <p className="text-xs text-stone-500">Only guests who completed bookings can review this hall.</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-black text-stone-900">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{hall.averageRating} / 5.0</span>
              </div>
            </div>

            <div className="space-y-3">
              {hall.reviews?.length === 0 ? (
                <p className="text-xs text-stone-400 py-4 text-center">
                  Be the first verified customer to host an event and review this venue!
                </p>
              ) : (
                hall.reviews?.map((r: any) => (
                  <div key={r.id} className="p-4 bg-stone-50 border border-stone-100 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900">{r.customer?.fullName || 'Verified Guest'}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                          Verified Booking
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    {r.title && <p className="text-xs font-bold text-stone-800">{r.title}</p>}
                    <p className="text-xs text-stone-600 leading-relaxed">{r.content}</p>
                    <p className="text-[10px] text-stone-400">
                      {new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sticky Column: Authoritative Server Price Calculator & Booking Lock */}
        <div id="booking-widget" className="lg:col-span-1 scroll-mt-24">
          <div className="sticky top-24 bg-white border border-amber-300 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div>
              <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wide">
                Instant Server Pricing
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-stone-900">
                  ₹{(pricingBreakdown?.totalAmount || hall.pricingRule?.baseRentalPrice || 50000).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-stone-600 font-semibold">Total Estimated</span>
              </div>
            </div>

            {/* Occasion Selector */}
            <div>
              <label htmlFor="booking-occasion" className="block text-[11px] font-bold text-stone-700 uppercase tracking-wide mb-1">
                Occasion *
              </label>
              <select
                id="booking-occasion"
                aria-label="Select Occasion for event"
                value={selectedOccasionId}
                onChange={(e) => setSelectedOccasionId(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500"
              >
                {hall.occasions?.map((ho: any) => (
                  <option key={ho.occasion.id} value={ho.occasion.id}>
                    {ho.occasion.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time Slot */}
            <div className="space-y-2">
              <div>
                <label htmlFor="booking-event-date" className="block text-[11px] font-bold text-stone-700 uppercase tracking-wide mb-1">
                  Event Date *
                </label>
                <input
                  id="booking-event-date"
                  aria-label="Select Event Date"
                  type="date"
                  value={eventDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="booking-start-time" className="block text-[11px] font-bold text-stone-700 uppercase tracking-wide mb-1">
                    Start Time
                  </label>
                  <input
                    id="booking-start-time"
                    aria-label="Start Time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800"
                  />
                </div>
                <div>
                  <label htmlFor="booking-end-time" className="block text-[11px] font-bold text-stone-700 uppercase tracking-wide mb-1">
                    End Time
                  </label>
                  <input
                    id="booking-end-time"
                    aria-label="End Time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800"
                  />
                </div>
              </div>
            </div>

            {/* Guest Count */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="booking-guests" className="text-[11px] font-bold text-stone-700 uppercase tracking-wide">
                  Guests *
                </label>
                <span className="text-[10px] text-stone-600 font-semibold">
                  Allowed: {hall.minCapacity} – {hall.maxCapacity}
                </span>
              </div>
              <input
                id="booking-guests"
                aria-label="Number of guests"
                type="number"
                min={hall.minCapacity}
                max={hall.maxCapacity}
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value || '0', 10))}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Catering Selection */}
            <div>
              <span className="block text-[11px] font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                Catering Package
              </span>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer min-h-[44px]">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="catering"
                      checked={cateringType === 'VEG'}
                      onChange={() => setCateringType('VEG')}
                      className="text-amber-700 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="font-semibold text-stone-800">Pure Vegetarian Feast</span>
                  </span>
                  <span className="font-bold text-stone-900">
                    ₹{hall.pricingRule?.perPlateVegPrice || 650}/plate
                  </span>
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer min-h-[44px]">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="catering"
                      checked={cateringType === 'NON_VEG'}
                      onChange={() => setCateringType('NON_VEG')}
                      className="text-amber-700 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="font-semibold text-stone-800">Royal Non-Veg & Veg Buffet</span>
                  </span>
                  <span className="font-bold text-stone-900">
                    ₹{hall.pricingRule?.perPlateNonVegPrice || 850}/plate
                  </span>
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer min-h-[44px]">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="catering"
                      checked={cateringType === 'NONE'}
                      onChange={() => setCateringType('NONE')}
                      className="text-amber-700 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="font-semibold text-stone-800">Hall Only (No Catering)</span>
                  </span>
                  <span className="font-bold text-stone-600">₹0</span>
                </label>
              </div>
            </div>

            {/* Addons Selection */}
            {hall.addons?.length > 0 && (
              <div>
                <span className="block text-[11px] font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                  Available Add-Ons
                </span>
                <div className="space-y-1.5 text-xs max-h-44 overflow-y-auto pr-1">
                  {hall.addons.map((a: any) => (
                    <label
                      key={a.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-stone-100 hover:bg-stone-50 cursor-pointer min-h-[44px]"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedAddonIds.includes(a.id)}
                          onChange={() => toggleAddon(a.id)}
                          className="rounded text-amber-700 focus:ring-amber-500 w-4 h-4"
                        />
                        <span className="font-medium text-stone-800">{a.name}</span>
                      </span>
                      <span className="font-bold text-stone-900">₹{a.price.toLocaleString()}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Slot Conflict Check Alert */}
            {availabilityStatus.checked && !availabilityStatus.available && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Slot Unavailable</p>
                  <p className="text-[11px]">{availabilityStatus.conflictReason}</p>
                </div>
              </div>
            )}

            {availabilityStatus.checked && availabilityStatus.available && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span className="font-bold">This time slot is available for instant lock!</span>
              </div>
            )}

            {/* Server Authoritative Price Breakdown */}
            {pricingBreakdown && (
              <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Base Venue Rental</span>
                  <span>₹{pricingBreakdown.baseRental.toLocaleString('en-IN')}</span>
                </div>

                {pricingBreakdown.isWeekend && pricingBreakdown.weekendSurcharge > 0 && (
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>Weekend Prime Surcharge</span>
                    <span>+₹{pricingBreakdown.weekendSurcharge.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {pricingBreakdown.cateringTotal > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Catering ({pricingBreakdown.guestCount} guests × ₹{pricingBreakdown.perPlateRate})</span>
                    <span>₹{pricingBreakdown.cateringTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {pricingBreakdown.addonsTotal > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Selected Add-Ons</span>
                    <span>₹{pricingBreakdown.addonsTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {pricingBreakdown.cleaningFee > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Cleaning & Maintenance</span>
                    <span>₹{pricingBreakdown.cleaningFee.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600">
                  <span>Taxes (GST 18%)</span>
                  <span>₹{pricingBreakdown.taxesAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-sm font-black text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Payable</span>
                  <span>₹{pricingBreakdown.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Book Now Button */}
            <button
              type="button"
              disabled={!availabilityStatus.available || calculatingPrice}
              onClick={handleProceedBooking}
              className={`w-full py-3.5 px-4 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 min-h-[44px] ${
                availabilityStatus.available && !calculatingPrice
                  ? 'bg-gradient-to-r from-brand-600 to-amber-700 hover:from-brand-700 hover:to-amber-800 text-white cursor-pointer'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
            >
              <span>{availabilityStatus.available ? 'Proceed to Book Slot' : 'Select Another Slot'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] text-stone-600 text-center">
              10-minute temporary payment hold guarantees slot during checkout.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Floating Sticky Booking CTA Bar (Visible on lg:hidden) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-stone-600 uppercase font-bold block">Estimated Price</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-stone-900">
              ₹{(pricingBreakdown?.totalAmount || hall.pricingRule?.baseRentalPrice || 50000).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-stone-600 font-semibold"> / event</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const widget = document.getElementById('booking-widget');
            if (widget) {
              widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-amber-700 hover:from-brand-700 hover:to-amber-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 min-h-[44px]"
        >
          <span>Check Dates & Book</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
