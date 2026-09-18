'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  Users,
  Calendar,
  MapPin,
  Building,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Layers,
  Music,
  Wine,
  Utensils,
  Car,
  Home,
} from 'lucide-react';
import {
  EventBrief,
  EVENT_TYPES,
  VENUE_TYPES,
  SEATING_STYLES,
  serializeEventBriefToQuery,
} from '@/lib/types/eventBrief';

interface SmartEventBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: Partial<EventBrief>;
}

const CITIES = ['Ahmedabad', 'Mumbai', 'Surat', 'Vadodara', 'Jaipur', 'Delhi NCR', 'Pune', 'Bengaluru'];

export default function SmartEventBriefModal({
  isOpen,
  onClose,
  initialValues,
}: SmartEventBriefModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [brief, setBrief] = useState<Partial<EventBrief>>({
    eventType: 'Wedding',
    guestCount: 200,
    city: 'Ahmedabad',
    flexibilityDays: 0,
    slot: 'FULL_DAY',
    spaceType: 'ANY',
    venueType: 'Banquet Hall',
    seatingStyle: 'FLOATING',
    cateringPreference: 'ANY',
    parkingNeeded: true,
    ...initialValues,
  });

  useEffect(() => {
    if (initialValues) {
      setBrief((prev) => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) setStep((prev) => (prev + 1) as any);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as any);
  };

  const handleFinish = () => {
    const query = serializeEventBriefToQuery(brief);
    onClose();
    router.push(`/search?${query}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-amber-100 flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-brand-700 via-amber-700 to-amber-600 text-white rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Smart Event Brief Assistant
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Design Your Perfect Event</h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1">
            Tell us about your celebration and we’ll match the optimal venues, layouts, and pricing.
          </p>

          {/* Progress Indicators */}
          <div className="flex items-center gap-2 mt-5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-amber-300' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-white/75 mt-1.5 font-medium">
            <span>1. Occasion & Guests</span>
            <span>2. Dates & Layout</span>
            <span>3. Preferences & Budget</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* STEP 1: Occasion & Guests */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  What type of event are you hosting?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBrief({ ...brief, eventType: type })}
                      className={`p-2.5 rounded-xl border text-xs sm:text-sm font-medium transition text-center ${
                        brief.eventType === type
                          ? 'border-brand-600 bg-brand-50 text-brand-700 font-semibold shadow-sm'
                          : 'border-gray-200 hover:border-amber-300 text-gray-700 bg-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Estimated Guest Count
                  </label>
                  <span className="text-sm font-bold text-brand-700">
                    {brief.guestCount || 0} Guests
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="20"
                    max="1500"
                    step="10"
                    value={brief.guestCount || 100}
                    onChange={(e) =>
                      setBrief({ ...brief, guestCount: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={brief.guestCount || ''}
                    onChange={(e) =>
                      setBrief({ ...brief, guestCount: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-24 p-2 border border-gray-300 rounded-lg text-sm text-center font-semibold"
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[50, 100, 250, 500, 800, 1200].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setBrief({ ...brief, guestCount: count })}
                      className="px-2.5 py-1 text-xs rounded-full border border-gray-200 hover:border-brand-400 bg-gray-50 text-gray-600"
                    >
                      {count}+
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Location / City
                </label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBrief({ ...brief, city: c })}
                      className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition ${
                        brief.city === c
                          ? 'border-brand-600 bg-brand-50 text-brand-700 font-semibold'
                          : 'border-gray-200 hover:border-amber-300 text-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Dates, Slot & Layout */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={brief.date || ''}
                    onChange={(e) => setBrief({ ...brief, date: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Slot Preference
                  </label>
                  <select
                    value={brief.slot || 'FULL_DAY'}
                    onChange={(e) => setBrief({ ...brief, slot: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    <option value="FULL_DAY">Full Day (10:00 AM - 11:00 PM)</option>
                    <option value="MORNING">Morning (09:00 AM - 03:00 PM)</option>
                    <option value="EVENING">Evening (05:00 PM - 11:30 PM)</option>
                    <option value="ANY">Flexible / Any Slot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Space Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'INDOOR', label: 'Indoor Hall' },
                    { id: 'OUTDOOR', label: 'Outdoor Lawn' },
                    { id: 'ANY', label: 'Both / Any' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setBrief({ ...brief, spaceType: s.id as any })}
                      className={`p-2.5 rounded-xl border text-xs sm:text-sm font-medium transition text-center ${
                        brief.spaceType === s.id
                          ? 'border-brand-600 bg-brand-50 text-brand-700 font-semibold shadow-sm'
                          : 'border-gray-200 hover:border-amber-300 text-gray-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Seating Layout & Density
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Seating setup affects the venue hall capacity required for your guests.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SEATING_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setBrief({ ...brief, seatingStyle: style.id })}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        brief.seatingStyle === style.id
                          ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                          : 'border-gray-200 hover:border-amber-300 text-gray-700'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-semibold">{style.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Capacity efficiency: {Math.round(style.ratio * 100)}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Preferences & Budget */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Venue Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VENUE_TYPES.map((vt) => (
                    <button
                      key={vt}
                      type="button"
                      onClick={() => setBrief({ ...brief, venueType: vt })}
                      className={`p-2 rounded-xl border text-xs font-medium transition text-center ${
                        brief.venueType === vt
                          ? 'border-brand-600 bg-brand-50 text-brand-700 font-semibold'
                          : 'border-gray-200 hover:border-amber-300 text-gray-700'
                      }`}
                    >
                      {vt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Total Estimated Budget (₹)
                  </label>
                  <select
                    value={brief.budgetTotal || ''}
                    onChange={(e) =>
                      setBrief({
                        ...brief,
                        budgetTotal: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    <option value="">Any Budget</option>
                    <option value="100000">Up to ₹1,00,000</option>
                    <option value="250000">Up to ₹2,50,000</option>
                    <option value="500000">Up to ₹5,00,000</option>
                    <option value="1000000">Up to ₹10,00,000</option>
                    <option value="2500000">₹10 Lakhs+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Catering Preference
                  </label>
                  <select
                    value={brief.cateringPreference || 'ANY'}
                    onChange={(e) =>
                      setBrief({ ...brief, cateringPreference: e.target.value as any })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    <option value="ANY">Any / In-house</option>
                    <option value="VEG_ONLY">Pure Vegetarian Only</option>
                    <option value="NON_VEG_ALLOWED">Non-Vegetarian Allowed</option>
                    <option value="OUTSIDE_ALLOWED">Outside Catering Permitted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Special Requirements
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBrief({ ...brief, parkingNeeded: !brief.parkingNeeded })}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                      brief.parkingNeeded
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    Dedicated Parking
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setBrief({ ...brief, alcoholPermitted: !brief.alcoholPermitted })
                    }
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                      brief.alcoholPermitted
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <Wine className="w-3.5 h-3.5" />
                    Alcohol Permitted
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrief({ ...brief, djMusicAllowed: !brief.djMusicAllowed })}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                      brief.djMusicAllowed
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    DJ & Music
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-2xl">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md flex items-center gap-1.5 transition"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              Find Matching Venues
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
