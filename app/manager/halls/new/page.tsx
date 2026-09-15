'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  CreditCard,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';

export default function NewHallWizardPage() {
  const router = useRouter();

  // Step Tracker (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);
  const [meta, setMeta] = useState<{ cities: any[]; occasions: any[]; amenities: any[] }>({
    cities: [],
    occasions: [],
    amenities: [],
  });

  // Step 1: Basic Information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cityId, setCityId] = useState('');
  const [localityId, setLocalityId] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Step 2: Capacity & Specifications
  const [minCapacity, setMinCapacity] = useState('100');
  const [maxCapacity, setMaxCapacity] = useState('600');
  const [indoorAreaSqFt, setIndoorAreaSqFt] = useState('10000');
  const [outdoorAreaSqFt, setOutdoorAreaSqFt] = useState('12000');
  const [hasParking, setHasParking] = useState(true);
  const [parkingCapacity, setParkingCapacity] = useState('150');
  const [roomsCount, setRoomsCount] = useState('4');

  // Step 3: Pricing Rules & Catering
  const [baseRentalPrice, setBaseRentalPrice] = useState('80000');
  const [weekendMultiplier, setWeekendMultiplier] = useState('1.15');
  const [cleaningFee, setCleaningFee] = useState('3000');
  const [perPlateVegPrice, setPerPlateVegPrice] = useState('700');
  const [perPlateNonVegPrice, setPerPlateNonVegPrice] = useState('950');

  // Step 4: Occasions & Amenities
  const [selectedOccasionIds, setSelectedOccasionIds] = useState<string[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);

  // Step 5: Media & Policies
  const [mediaUrl1, setMediaUrl1] = useState('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80');
  const [mediaUrl2, setMediaUrl2] = useState('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80');
  const [alcoholAllowed, setAlcoholAllowed] = useState(false);
  const [outsideCateringAllowed, setOutsideCateringAllowed] = useState(false);
  const [outsideDecorAllowed, setOutsideDecorAllowed] = useState(true);
  const [cancellationDeadlineHours, setCancellationDeadlineHours] = useState('72');
  const [refundPercentage, setRefundPercentage] = useState('80');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/meta');
        if (res.ok) {
          const data = await res.json();
          setMeta(data);
          if (data.cities?.length > 0) setCityId(data.cities[0].id);
          // Default select first few occasions & amenities
          if (data.occasions?.length > 0) {
            setSelectedOccasionIds(data.occasions.slice(0, 3).map((o: any) => o.id));
          }
          if (data.amenities?.length > 0) {
            setSelectedAmenityIds(data.amenities.slice(0, 5).map((a: any) => a.id));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, []);

  const toggleOccasion = (id: string) => {
    setSelectedOccasionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const mediaUrls = [mediaUrl1, mediaUrl2].filter(Boolean);

      const res = await fetch('/api/manager/halls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          cityId,
          localityId: localityId || undefined,
          address,
          contactPhone,
          contactEmail,
          minCapacity: parseInt(minCapacity, 10),
          maxCapacity: parseInt(maxCapacity, 10),
          indoorAreaSqFt: indoorAreaSqFt ? parseInt(indoorAreaSqFt, 10) : undefined,
          outdoorAreaSqFt: outdoorAreaSqFt ? parseInt(outdoorAreaSqFt, 10) : undefined,
          hasParking,
          parkingCapacity: parkingCapacity ? parseInt(parkingCapacity, 10) : undefined,
          roomsCount: parseInt(roomsCount, 10),
          baseRentalPrice: parseFloat(baseRentalPrice),
          weekendMultiplier: parseFloat(weekendMultiplier),
          cleaningFee: parseFloat(cleaningFee),
          perPlateVegPrice: parseFloat(perPlateVegPrice),
          perPlateNonVegPrice: parseFloat(perPlateNonVegPrice),
          occasionIds: selectedOccasionIds,
          amenityIds: selectedAmenityIds,
          mediaUrls,
          alcoholAllowed,
          outsideCateringAllowed,
          outsideDecorAllowed,
          cancellationDeadlineHours: parseInt(cancellationDeadlineHours, 10),
          refundPercentage: parseFloat(refundPercentage),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit hall listing');

      // Success -> Redirect to manager venues list
      router.push('/manager/halls');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCityObj = meta.cities.find((c) => c.id === cityId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Create Banquet Hall Listing</h1>
          <p className="text-xs text-stone-500">Guided submission wizard for new venue registration</p>
        </div>

        <Link href="/manager/halls" className="text-xs font-bold text-amber-800 hover:underline">
          Cancel & Exit
        </Link>
      </div>

      {/* Publishing Lifecycle Warning */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Strict Two-Stage Publishing Lifecycle</p>
          <p className="text-amber-800">
            Upon submission, your hall will enter <strong>PENDING APPROVAL</strong>. An authorized platform administrator will review your venue details, photos, and requested occasions before it becomes visible to customers.
          </p>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold">
        {[
          { num: 1, label: 'Basic Info' },
          { num: 2, label: 'Capacity' },
          { num: 3, label: 'Pricing' },
          { num: 4, label: 'Occasions' },
          { num: 5, label: 'Media & Rules' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setCurrentStep(s.num)}
            className={`p-2 rounded-xl border transition ${
              currentStep === s.num
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : currentStep > s.num
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-white text-stone-400 border-stone-200'
            }`}
          >
            Step {s.num}: {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Forms */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-base font-extrabold text-stone-900">Step 1: Basic Venue Information</h2>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Hall / Venue Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Saffron Grand Ballrooms"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Description & Architecture Highlights *</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your ballroom, chandelier height, dining hall, lawn ambiance, and hospitality services..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Operating City *</label>
                <select
                  value={cityId}
                  onChange={(e) => {
                    setCityId(e.target.value);
                    setLocalityId('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                >
                  {meta.cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Locality / Neighborhood</label>
                <select
                  value={localityId}
                  onChange={(e) => setLocalityId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select locality...</option>
                  {selectedCityObj?.localities?.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Complete Physical Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot 12, Main Road, Landmark..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Venue Reception Phone *</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98450 00000"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Venue Inquiries Email *</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="events@venue.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Capacity & Specifications */}
        {currentStep === 2 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-base font-extrabold text-stone-900">Step 2: Capacity & Dimensions</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Minimum Guest Capacity *</label>
                <input
                  type="number"
                  min="20"
                  required
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Maximum Guest Capacity *</label>
                <input
                  type="number"
                  min="50"
                  required
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Indoor Hall Area (sq. ft)</label>
                <input
                  type="number"
                  value={indoorAreaSqFt}
                  onChange={(e) => setIndoorAreaSqFt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Outdoor Lawn Area (sq. ft)</label>
                <input
                  type="number"
                  value={outdoorAreaSqFt}
                  onChange={(e) => setOutdoorAreaSqFt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Car Parking Capacity</label>
                <input
                  type="number"
                  value={parkingCapacity}
                  onChange={(e) => setParkingCapacity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Bridal / Guest Rooms Count</label>
                <input
                  type="number"
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pricing Rules */}
        {currentStep === 3 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-base font-extrabold text-stone-900">Step 3: Pricing Rules & Catering Rates</h2>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Base Hall Rental Price (₹) *</label>
              <input
                type="number"
                required
                value={baseRentalPrice}
                onChange={(e) => setBaseRentalPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Weekend Surcharge Multiplier</label>
                <input
                  type="number"
                  step="0.05"
                  value={weekendMultiplier}
                  onChange={(e) => setWeekendMultiplier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-stone-400">e.g. 1.15 = 15% weekend premium</span>
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Cleaning & Sanitization Fee (₹)</label>
                <input
                  type="number"
                  value={cleaningFee}
                  onChange={(e) => setCleaningFee(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Per-Plate Vegetarian Buffet (₹)</label>
                <input
                  type="number"
                  value={perPlateVegPrice}
                  onChange={(e) => setPerPlateVegPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Per-Plate Non-Vegetarian Buffet (₹)</label>
                <input
                  type="number"
                  value={perPlateNonVegPrice}
                  onChange={(e) => setPerPlateNonVegPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Occasions & Amenities */}
        {currentStep === 4 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-base font-extrabold text-stone-900">Step 4: Supported Occasions & Amenities</h2>
              <p className="text-stone-500 mt-0.5">
                Note: Requested occasions require independent administrative approval. Only approved occasions will appear to customers.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-stone-800 uppercase text-[11px]">Proposed Supported Occasions *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {meta.occasions.map((occ) => {
                  const isChecked = selectedOccasionIds.includes(occ.id);
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => toggleOccasion(occ.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                        isChecked
                          ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold shadow-sm'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="truncate">{occ.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-stone-100">
              <label className="block font-bold text-stone-800 uppercase text-[11px]">Amenities & Facilities Available</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {meta.amenities.map((amen) => {
                  const isChecked = selectedAmenityIds.includes(amen.id);
                  return (
                    <button
                      key={amen.id}
                      type="button"
                      onClick={() => toggleAmenity(amen.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-sm'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{amen.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Media & Policies */}
        {currentStep === 5 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-base font-extrabold text-stone-900">Step 5: Media Gallery & Policies</h2>

            <div className="space-y-2">
              <label className="block font-semibold text-stone-700">Cover Photo URL *</label>
              <input
                type="url"
                required
                value={mediaUrl1}
                onChange={(e) => setMediaUrl1(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-stone-700">Additional Gallery Photo URL</label>
              <input
                type="url"
                value={mediaUrl2}
                onChange={(e) => setMediaUrl2(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-100">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Cancellation Notice (Hours)</label>
                <input
                  type="number"
                  value={cancellationDeadlineHours}
                  onChange={(e) => setCancellationDeadlineHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Refund Percentage (%)</label>
                <input
                  type="number"
                  value={refundPercentage}
                  onChange={(e) => setRefundPercentage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={alcoholAllowed}
                  onChange={(e) => setAlcoholAllowed(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Alcohol Allowed (with legal event permit)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={outsideCateringAllowed}
                  onChange={(e) => setOutsideCateringAllowed(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Outside Catering Allowed</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={outsideDecorAllowed}
                  onChange={(e) => setOutsideDecorAllowed(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Outside Decor Allowed</span>
              </label>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <span>{loading ? 'Submitting to Review Queue...' : 'Submit Venue for Admin Approval'}</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
