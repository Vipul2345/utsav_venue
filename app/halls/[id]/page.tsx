'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams, notFound } from 'next/navigation';
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
  Play,
  X,
  Video,
  Layers,
  Scale,
  FileText,
  Download,
} from 'lucide-react';
import CompareTray, {
  addVenueToCompare,
  removeVenueFromCompare,
  isVenueCompared,
} from '@/components/CompareTray';
import { SEATING_STYLES } from '@/lib/types/eventBrief';

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
  const searchParams = useSearchParams();
  const hallId = params.id as string;

  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking & Pricing state
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('23:00');
  const [guestCount, setGuestCount] = useState<number>(300);
  const [cateringType, setCateringType] = useState<'NONE' | 'VEG' | 'NON_VEG'>('VEG');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [pastEventCategory, setPastEventCategory] = useState<string>('ALL');
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  // Layout & Comparison state
  const [selectedSeatingStyle, setSelectedSeatingStyle] = useState<string>('FLOATING');
  const [isCompared, setIsCompared] = useState(false);

  // Custom Quote Modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteCustomerName, setQuoteCustomerName] = useState('');
  const [quoteCustomerEmail, setQuoteCustomerEmail] = useState('');
  const [quoteCustomerPhone, setQuoteCustomerPhone] = useState('');
  const [quoteSpecialReq, setQuoteSpecialReq] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Calculated Pricing Breakdown
  const [pricingBreakdown, setPricingBreakdown] = useState<any>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  // Availability status - starts unverified until dates are chosen
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    checked: boolean;
    available: boolean;
    conflictReason?: string;
  }>({ checked: false, available: false });

  // Verified Customer Review State
  const [eligibleBooking, setEligibleBooking] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Fetch hall details
  useEffect(() => {
    async function fetchHall() {
      setLoading(true);
      try {
        const res = await fetch(`/api/halls/${hallId}`);
        if (res.status === 404) {
          notFound();
          return;
        }
        if (!res.ok) throw new Error('Venue not found');
        const data = await res.json();
        if (!data.hall) {
          notFound();
          return;
        }
        setHall(data.hall);

        // Pre-select first approved occasion
        if (data.hall.occasions?.length > 0) {
          setSelectedOccasionId(data.hall.occasions[0].occasion.id);
        }
        // Pre-set default guest count within capacity
        if (data.hall.minCapacity) {
          setGuestCount(Math.max(data.hall.minCapacity, Math.min(300, data.hall.maxCapacity)));
        }

        // Check if viewing customer has an eligible completed booking ready to review
        try {
          const revRes = await fetch(`/api/reviews?hallId=${data.hall.id}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            setEligibleBooking(revData.eligibleBooking || null);
          }
        } catch {
          // Non-blocking for unauthenticated or non-customer sessions
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHall();
  }, [hallId]);

  const handleSubmitHallReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibleBooking || !hall) return;
    setSubmittingReview(true);
    setReviewError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: eligibleBooking.id,
          hallId: hall.id,
          rating: reviewRating,
          title: reviewTitle,
          content: reviewContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setReviewSuccess(true);
      setEligibleBooking(null);

      // Refresh hall data to reflect new review and updated rating
      const refreshRes = await fetch(`/api/halls/${hallId}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setHall(refreshData.hall);
      }
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Pre-fill date range from URL query parameters if provided
  useEffect(() => {
    const qStart = searchParams.get('startDate') || searchParams.get('date');
    const qEnd = searchParams.get('endDate') || qStart;
    if (qStart) {
      setStartDate(qStart);
      setEndDate(qEnd || qStart);
    }
  }, [searchParams]);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (!endDate || val > endDate) {
      setEndDate(val);
    }
  };

  const handleEndDateChange = (val: string) => {
    if (val < startDate) {
      return; // End date cannot be earlier than start date
    }
    setEndDate(val);
  };

  const diffDays =
    startDate && endDate
      ? Math.max(
          0,
          Math.round(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;
  const numberOfDays = diffDays + 1;

  // Recalculate price and availability when parameters change
  useEffect(() => {
    if (!hall || !startDate || !endDate || !guestCount) return;

    let isCancelled = false;

    async function updatePriceAndSlot() {
      setCalculatingPrice(true);
      try {
        // 1. Authoritative price calculation
        const priceRes = await fetch(`/api/halls/${hall.id}/calculate-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventDate: startDate,
            startDate,
            endDate,
            startTime,
            endTime,
            guestCount,
            cateringType,
            selectedAddonIds,
            packageId: selectedPackageId || undefined,
          }),
        });
        if (priceRes.ok && !isCancelled) {
          const pData = await priceRes.json();
          setPricingBreakdown(pData.pricing);
        }

        // 2. Check slot availability
        const availRes = await fetch(
          `/api/halls/${hall.id}/availability?date=${startDate}&startDate=${startDate}&endDate=${endDate}&startTime=${startTime}&endTime=${endTime}`
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
  }, [hall, startDate, endDate, startTime, endTime, guestCount, cateringType, selectedAddonIds, selectedPackageId]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Sync comparison state
  useEffect(() => {
    if (!hall) return;
    const sync = () => {
      setIsCompared(isVenueCompared(hall.id));
    };
    sync();
    window.addEventListener('utsav_compare_updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('utsav_compare_updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, [hall]);

  const handleToggleCompare = () => {
    if (!hall) return;
    if (isVenueCompared(hall.id)) {
      removeVenueFromCompare(hall.id);
      setIsCompared(false);
    } else {
      const added = addVenueToCompare({
        id: hall.id,
        name: hall.name,
        slug: hall.slug,
        image: hall.media?.[0]?.url,
        city: hall.city?.name,
      });
      if (added) setIsCompared(true);
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSubmitting(true);
    setQuoteError(null);
    try {
      const selectedOccasion =
        hall.occasions?.find((o: any) => o.occasion.id === selectedOccasionId)?.occasion?.name ||
        'Wedding';
      const eventDateToUse =
        startDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallId: hall.id,
          customerName: quoteCustomerName,
          customerEmail: quoteCustomerEmail,
          customerPhone: quoteCustomerPhone,
          eventType: selectedOccasion,
          guestCount,
          eventDate: eventDateToUse,
          slot: startTime < '15:00' && endTime <= '16:00' ? 'MORNING' : 'FULL_DAY',
          packageId: selectedPackageId || undefined,
          selectedAddons: selectedAddonIds.map((id) => ({ addonId: id })),
          specialRequirements: quoteSpecialReq,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit quote request');
      }

      const data = await res.json();
      setQuoteResult(data);
    } catch (err: any) {
      setQuoteError(err.message);
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const handleProceedBooking = () => {
    if (!startDate || !endDate || !availabilityStatus.available) return;

    // Navigate to checkout with pre-selected parameters
    const params = new URLSearchParams({
      occasionId: selectedOccasionId,
      date: startDate,
      startDate,
      endDate,
      startTime,
      endTime,
      guests: guestCount.toString(),
      catering: cateringType,
      addons: selectedAddonIds.join(','),
      ...(selectedPackageId ? { packageId: selectedPackageId } : {}),
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
    notFound();
    return null;
  }

  const mediaList = hall.media || [];
  const currentImage = mediaList[activeImageIndex]?.url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-28 lg:pb-8">
      {/* Title & Location Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[10px] uppercase tracking-wider">
              {hall.venueType || 'Banquet Hall'}
            </span>
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

        {/* Rating & Actions Card */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={handleToggleCompare}
            className={`px-3.5 py-3 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm min-h-[48px] ${
              isCompared
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
            }`}
            title={isCompared ? 'Remove from comparison' : 'Add to side-by-side comparison'}
          >
            <Scale className="w-4 h-4 text-amber-700" />
            <span>{isCompared ? 'In Compare' : 'Add to Compare'}</span>
          </button>

          <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-2xl p-3 shadow-sm">
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

      {/* Mobile Top Action Bar: 'Check dates and pricing' toward the top */}
      <div className="lg:hidden bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wide block">
            Instant Availability & Pricing
          </span>
          <span className="text-xs font-bold text-stone-800">
            Select dates & lock your celebration slot
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            const widget = document.getElementById('booking-widget');
            if (widget) {
              widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-amber-700 hover:from-brand-700 hover:to-amber-800 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 shrink-0 min-h-[44px]"
        >
          <span>Check dates and pricing</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
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

          {/* Seating Layout & Capacity Calculator */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-stone-900">Seating Layout & Density Calculator</h2>
                <p className="text-xs text-stone-500">
                  Floor capacity adapts depending on how tables and seating are arranged.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Max Hall Limit: {hall.maxCapacity} Guests
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SEATING_STYLES.map((style) => {
                const effectiveCapacity = Math.round(hall.maxCapacity * style.ratio);
                const isSelected = selectedSeatingStyle === style.id;
                const canAccommodate = effectiveCapacity >= guestCount;

                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedSeatingStyle(style.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/70 text-brand-900 shadow-sm ring-1 ring-brand-500'
                        : 'border-stone-200 hover:border-amber-300 bg-stone-50/50'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{style.label}</span>
                      <span className="text-lg font-black text-stone-900 block mt-1">
                        ~{effectiveCapacity}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {Math.round(style.ratio * 100)}% density ratio
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-stone-200/60">
                      {canAccommodate ? (
                        <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                          ✓ Fits {guestCount} guests
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                          ⚠️ Needs ~{Math.ceil(guestCount / style.ratio)} cap
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
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

          {/* Feature 3: Curated Event Packages & Bundles */}
          {hall.packages && hall.packages.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                    <Layers className="w-3 h-3 text-amber-700" />
                    <span>Bundled Value</span>
                  </div>
                  <h2 className="text-base font-bold text-stone-900">Curated Event Packages</h2>
                  <p className="text-xs text-stone-500">
                    Select an all-inclusive bundle or book standard venue rental with optional add-ons.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hall.packages.map((pkg: any) => {
                  const isSelected = selectedPackageId === pkg.id;
                  let parsedServices: string[] = [];
                  if (pkg.includedServices) {
                    try {
                      parsedServices = JSON.parse(pkg.includedServices);
                    } catch {
                      parsedServices = String(pkg.includedServices).split(',').map((s: string) => s.trim()).filter(Boolean);
                    }
                  }

                  return (
                    <div
                      key={pkg.id}
                      className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20'
                          : 'border-stone-200 bg-stone-50/50 hover:border-amber-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-extrabold text-sm text-stone-900">{pkg.name}</h3>
                          <span className="font-black text-amber-800 text-sm">
                            +₹{pkg.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {pkg.description && (
                          <p className="text-xs text-stone-600 mb-3">{pkg.description}</p>
                        )}

                        {parsedServices.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-stone-200/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Included Services:</span>
                            <ul className="grid grid-cols-1 gap-1 text-xs text-stone-700">
                              {parsedServices.map((svc: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{svc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedPackageId(isSelected ? '' : pkg.id)}
                        className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-white border border-stone-200 hover:bg-amber-50 text-stone-800'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Package Selected</span>
                          </>
                        ) : (
                          <span>Select This Package</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feature 2: Past Events Showcase Gallery */}
          {hall.pastEvents && hall.pastEvents.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-stone-900">Past Events Showcase</h2>
                  <p className="text-xs text-stone-500">
                    See real celebrations, wedding mandaps, and banquets hosted at this venue.
                  </p>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {['ALL', 'Wedding', 'Reception', 'Corporate', 'Birthday'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPastEventCategory(cat)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap ${
                        pastEventCategory === cat
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Events' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {hall.pastEvents
                  .filter((m: any) => pastEventCategory === 'ALL' || (m.category && m.category.toLowerCase().includes(pastEventCategory.toLowerCase())))
                  .map((item: any) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs hover:shadow-md transition aspect-video flex flex-col justify-end"
                    >
                      {item.mediaType === 'VIDEO' ? (
                        <>
                          <video
                            src={item.url}
                            muted
                            playsInline
                            preload="none"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setActiveVideoModal(item.url)}
                            className="absolute inset-0 flex items-center justify-center bg-stone-950/30 group-hover:bg-stone-950/50 transition cursor-pointer"
                            aria-label={`Play past event video: ${item.title || 'Event'}`}
                          >
                            <div className="w-10 h-10 rounded-full bg-amber-600/90 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            </div>
                          </button>
                        </>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.title || item.caption || 'Past Event'}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          loading="lazy"
                        />
                      )}

                      {/* Caption Overlay */}
                      <div className="relative z-10 p-2.5 bg-gradient-to-t from-stone-950/90 via-stone-950/60 to-transparent text-white">
                        <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase text-amber-300">
                          {item.mediaType === 'VIDEO' ? <Video className="w-3 h-3" /> : null}
                          <span>{item.category || 'Celebration'}</span>
                        </div>
                        {item.title && <p className="font-bold text-xs truncate mt-0.5">{item.title}</p>}
                        {item.caption && <p className="text-[10px] text-stone-300 line-clamp-1">{item.caption}</p>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Past Event Video Modal */}
          {activeVideoModal && (
            <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-2xl">
                <button
                  type="button"
                  onClick={() => setActiveVideoModal(null)}
                  className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
                  aria-label="Close video player"
                >
                  <X className="w-5 h-5" />
                </button>
                <video
                  src={activeVideoModal}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[75vh] object-contain"
                />
              </div>
            </div>
          )}

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

            {/* Eligible Verified Customer Review Card */}
            {eligibleBooking && (
              <div className="bg-gradient-to-br from-amber-50/70 via-white to-stone-50 border border-amber-300/80 rounded-2xl p-5 space-y-3.5 shadow-sm">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Verified Host ({eligibleBooking.bookingNumber})
                  </span>
                  <h3 className="text-sm font-extrabold text-stone-900 mt-1.5">
                    Your booking is complete. How was your experience?
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Rate this venue and share your celebration feedback to help future event planners.
                  </p>
                </div>

                {reviewSuccess ? (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Thank you! Your verified review has been published.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitHallReview} className="space-y-3 text-xs">
                    {reviewError && (
                      <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
                        {reviewError}
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Your Rating</label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewRating(s)}
                            className="p-1 hover:scale-110 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                            aria-label={`Rate ${s} stars`}
                          >
                            <Star
                              className={`w-6 h-6 ${
                                s <= reviewRating
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-stone-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-stone-700 ml-2">
                          {reviewRating} of 5 Stars
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Review Title</label>
                      <input
                        type="text"
                        required
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="e.g. Magnificent wedding hall and food!"
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Your Written Review *</label>
                      <textarea
                        required
                        rows={3}
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        placeholder="Tell other hosts about the stage, parking, air conditioning, and catering service..."
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2.5 min-h-[44px] bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4 fill-white" />
                      <span>{submittingReview ? 'Submitting...' : 'Submit Verified Review'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

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

            {/* Multi-Day Date Range & Time Slot */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="booking-start-date" className="block text-[11px] font-bold text-stone-700 uppercase tracking-wide mb-1">
                    Start Date *
                  </label>
                  <input
                    id="booking-start-date"
                    aria-label="Select Event Start Date"
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label htmlFor="booking-end-date" className="block text-[11px] font-bold text-stone-700 uppercase tracking-wide mb-1">
                    End Date *
                  </label>
                  <input
                    id="booking-end-date"
                    aria-label="Select Event End Date"
                    type="date"
                    value={endDate}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Duration Summary Badge */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs">
                <span className="text-[11px] font-medium text-stone-600">Selected Duration:</span>
                <span className="font-extrabold text-amber-900 bg-white px-2 py-0.5 rounded-lg border border-amber-200 shadow-2xs">
                  {numberOfDays} Day{numberOfDays > 1 ? 's' : ''} (Inclusive)
                </span>
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

              {/* Bulk Volume Discount Tier Callout */}
              <div className="mt-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px]">
                {guestCount >= 300 ? (
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Mega Tier Unlocked: 12% Bulk Discount on Base Rental!</span>
                  </div>
                ) : guestCount >= 200 ? (
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Grand Tier Unlocked: 8% Bulk Discount on Base Rental!</span>
                  </div>
                ) : guestCount >= 100 ? (
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Classic Tier Unlocked: 5% Bulk Discount on Base Rental!</span>
                  </div>
                ) : (
                  <div className="text-stone-600 text-[10px] flex items-center gap-1">
                    <Info className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Tiered guest discounts: 100+ (5%), 200+ (8%), 300+ (12% off base rental).</span>
                  </div>
                )}
              </div>
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

            {/* Slot Conflict Check Alert / Date Selection Prompt */}
            {!startDate || !endDate ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-semibold">Select your dates to verify slot availability</span>
              </div>
            ) : availabilityStatus.checked && !availabilityStatus.available ? (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Slot Unavailable</p>
                  <p className="text-[11px]">{availabilityStatus.conflictReason}</p>
                </div>
              </div>
            ) : availabilityStatus.checked && availabilityStatus.available ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span className="font-bold">This time slot is available for instant lock!</span>
              </div>
            ) : null}

            {/* Server Authoritative Price Breakdown */}
            {pricingBreakdown && (
              <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>
                    Base Venue Rental
                    {pricingBreakdown.numberOfDays > 1 && (
                      <span className="text-[10px] text-stone-500 ml-1">
                        ({pricingBreakdown.numberOfDays} days × ₹{(pricingBreakdown.dailyBaseRental || 0).toLocaleString('en-IN')})
                      </span>
                    )}
                  </span>
                  <span>₹{pricingBreakdown.baseRental.toLocaleString('en-IN')}</span>
                </div>

                {pricingBreakdown.weekendSurcharge > 0 && (
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>
                      Weekend Prime Surcharge
                      {pricingBreakdown.weekendDaysCount > 0 && (
                        <span className="text-[10px] text-amber-700 ml-1">
                          ({pricingBreakdown.weekendDaysCount} weekend day{pricingBreakdown.weekendDaysCount > 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                    <span>+₹{pricingBreakdown.weekendSurcharge.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {pricingBreakdown.packagePrice > 0 && (
                  <div className="flex justify-between text-purple-700 font-medium">
                    <span>Package: {pricingBreakdown.packageName || 'Curated Bundle'}</span>
                    <span>+₹{pricingBreakdown.packagePrice.toLocaleString('en-IN')}</span>
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

                {pricingBreakdown.bulkDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50/60 px-1.5 py-0.5 rounded">
                    <span>
                      Bulk Guest Discount ({pricingBreakdown.bulkDiscountTier ? `${pricingBreakdown.bulkDiscountTier} ` : ''}-{pricingBreakdown.bulkDiscountPercent}%)
                    </span>
                    <span>-₹{pricingBreakdown.bulkDiscountAmount.toLocaleString('en-IN')}</span>
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
              disabled={!startDate || !endDate || !availabilityStatus.available || calculatingPrice}
              onClick={handleProceedBooking}
              className={`w-full py-3.5 px-4 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 min-h-[44px] ${
                startDate && endDate && availabilityStatus.available && !calculatingPrice
                  ? 'bg-gradient-to-r from-brand-600 to-amber-700 hover:from-brand-700 hover:to-amber-800 text-white cursor-pointer'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
            >
              <span>
                {!startDate || !endDate
                  ? 'Select Dates to Check Availability'
                  : availabilityStatus.available
                  ? 'Proceed to Book Slot'
                  : 'Select Another Slot'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Request Official Quote CTA */}
            <button
              type="button"
              onClick={() => setQuoteModalOpen(true)}
              className="w-full py-3 px-4 bg-white border border-brand-600 hover:bg-brand-50 text-brand-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 min-h-[44px]"
            >
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Request Official Quote</span>
            </button>

            <p className="text-[10px] text-stone-600 text-center">
              10-minute temporary payment hold guarantees slot during checkout.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Floating Sticky Booking CTA Bar (Visible on lg:hidden) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-2xl flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-stone-600 uppercase font-bold block">
            {pricingBreakdown?.numberOfDays && pricingBreakdown.numberOfDays > 1
              ? `Estimated Total (${pricingBreakdown.numberOfDays} Days)`
              : 'Estimated Price'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-stone-900">
              ₹{(pricingBreakdown?.totalAmount || hall.pricingRule?.baseRentalPrice || 50000).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-stone-600 font-semibold"> total</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuoteModalOpen(true)}
            className="px-3 py-2.5 bg-white border border-brand-600 text-brand-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 min-h-[44px]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quote</span>
          </button>

          <button
            type="button"
            disabled={calculatingPrice}
            onClick={() => {
              if (startDate && endDate && availabilityStatus.available && !calculatingPrice) {
                handleProceedBooking();
              } else {
                const widget = document.getElementById('booking-widget');
                if (widget) {
                  widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
            }}
            className={`px-4 py-2.5 font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 min-h-[44px] ${
              startDate && endDate && availabilityStatus.available && !calculatingPrice
                ? 'bg-gradient-to-r from-brand-600 to-amber-700 hover:from-brand-700 hover:to-amber-800 text-white cursor-pointer'
                : 'bg-amber-100 text-amber-900 border border-amber-300 cursor-pointer font-bold'
            }`}
          >
            <span>
              {!startDate || !endDate
                ? 'Check Dates'
                : availabilityStatus.available
                ? 'Book Slot'
                : 'Check Dates'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quote Request Modal */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-amber-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-gray-900 text-base">Request Official Quote</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuoteModalOpen(false);
                  setQuoteResult(null);
                  setQuoteError(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quoteResult ? (
              <div className="space-y-4 py-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Quote Request Generated Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Quote Reference:{' '}
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                      {quoteResult.quoteNumber}
                    </span>
                  </p>
                  <p className="text-xs text-emerald-800">
                    Estimated Amount:{' '}
                    <span className="font-bold">
                      ₹{quoteResult.breakdown?.totalEstimatedAmount?.toLocaleString('en-IN')}
                    </span>
                  </p>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p>✓ A copy of this quote has been saved to your account.</p>
                  <p>✓ Utsav Venues concierge team will coordinate availability with venue management on your behalf.</p>
                  <p className="font-semibold text-gray-800">Strict Zero Spam Guarantee: Your contact info remains private and is never distributed.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuoteModalOpen(false);
                    setQuoteResult(null);
                  }}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="space-y-3.5 text-xs">
                {quoteError && (
                  <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
                    {quoteError}
                  </div>
                )}

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="font-bold text-stone-900">{hall.name}</div>
                  <div className="text-stone-600 flex justify-between">
                    <span>Target Guests: {guestCount}</span>
                    <span>Date: {startDate || 'Next Available Slot'}</span>
                  </div>
                  <div className="text-brand-700 font-extrabold flex justify-between pt-1 border-t border-amber-200/60">
                    <span>Estimated Total:</span>
                    <span>
                      ₹{(pricingBreakdown?.totalAmount || hall.pricingRule?.baseRentalPrice || 50000).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={quoteCustomerName}
                    onChange={(e) => setQuoteCustomerName(e.target.value)}
                    placeholder="e.g. Priyesh Patel"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={quoteCustomerEmail}
                      onChange={(e) => setQuoteCustomerEmail(e.target.value)}
                      placeholder="e.g. priyesh@example.com"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={quoteCustomerPhone}
                      onChange={(e) => setQuoteCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Special Requirements or Custom Add-ons
                  </label>
                  <textarea
                    rows={2}
                    value={quoteSpecialReq}
                    onChange={(e) => setQuoteSpecialReq(e.target.value)}
                    placeholder="e.g. Jain food options, specific mandap height, early decor setup..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={quoteSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-amber-700 hover:from-brand-700 hover:to-amber-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>{quoteSubmitting ? 'Generating Quote...' : 'Submit Quote Request'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Compare Sticky Tray */}
      <CompareTray />
    </div>
  );
}
