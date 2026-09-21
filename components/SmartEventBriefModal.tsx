'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Check,
  Edit3,
  Sliders,
  Clock,
  ShieldCheck,
  AlertCircle,
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

const CITIES = [
  'Ahmedabad',
  'Mumbai',
  'Surat',
  'Vadodara',
  'Jaipur',
  'Delhi NCR',
  'Pune',
  'Bengaluru',
];

const GUEST_PRESETS = [50, 100, 250, 500, 800, 1200];

export default function SmartEventBriefModal({
  isOpen,
  onClose,
  initialValues,
}: SmartEventBriefModalProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

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
    alcoholPermitted: false,
    djMusicAllowed: true,
    ...initialValues,
  });

  const [guestInputStr, setGuestInputStr] = useState<string>(
    (initialValues?.guestCount || 200).toString()
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync initialValues
  useEffect(() => {
    if (initialValues) {
      setBrief((prev) => ({ ...prev, ...initialValues }));
      if (initialValues.guestCount) {
        setGuestInputStr(initialValues.guestCount.toString());
      }
    }
  }, [initialValues]);

  // Handle body scroll lock & modal-open indicator class
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('smart-modal-active');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('smart-modal-active');
      setStep(1);
      setValidationError(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('smart-modal-active');
    };
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Ensure scrollable content is always at top when modal opens or step changes
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      });
    }
  }, [isOpen, step]);

  if (!isOpen || !mounted) return null;

  // Guest count input handler with strict validation
  const handleGuestInputChange = (val: string) => {
    setValidationError(null);
    if (val === '') {
      setGuestInputStr('');
      setBrief((prev) => ({ ...prev, guestCount: 0 }));
      return;
    }
    const cleanVal = val.replace(/[^0-9]/g, '');
    const num = parseInt(cleanVal, 10);
    if (!isNaN(num)) {
      const bounded = Math.min(Math.max(0, num), 5000);
      setGuestInputStr(bounded.toString());
      setBrief((prev) => ({ ...prev, guestCount: bounded }));
    }
  };

  const handleSliderChange = (num: number) => {
    setValidationError(null);
    setGuestInputStr(num.toString());
    setBrief((prev) => ({ ...prev, guestCount: num }));
  };

  const handlePresetClick = (count: number) => {
    setValidationError(null);
    setGuestInputStr(count.toString());
    setBrief((prev) => ({ ...prev, guestCount: count }));
  };

  // Step validation
  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!brief.eventType) {
        setValidationError('Please select an event type to continue.');
        return false;
      }
      if (!brief.guestCount || brief.guestCount < 1) {
        setValidationError('Please enter a valid guest count (at least 1 guest).');
        return false;
      }
      if (!brief.city) {
        setValidationError('Please choose a location/city.');
        return false;
      }
    }
    setValidationError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step < 4) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    } else {
      onClose();
    }
  };

  const handleFinish = () => {
    const query = serializeEventBriefToQuery(brief);
    onClose();
    router.push(`/search?${query}`);
  };

  const stepTitles = [
    { num: 1, title: 'Event Details', sub: 'Occasion, Guests & City' },
    { num: 2, title: 'Date & Layout', sub: 'Timing, Space & Seating' },
    { num: 3, title: 'Preferences', sub: 'Venue Type & Budget' },
    { num: 4, title: 'Review & Match', sub: 'Confirm & Discover Venues' },
  ];

  // Calculated seating ratio recommendation
  const currentSeatingStyle = SEATING_STYLES.find((s) => s.id === brief.seatingStyle) || SEATING_STYLES[0];
  const calculatedRecommendedCapacity = Math.round((brief.guestCount || 200) / currentSeatingStyle.ratio);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-900/75 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-brief-title"
    >
      {/* Background click to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Dialog Container */}
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl lg:max-w-3xl bg-white sm:rounded-2xl shadow-2xl border-0 sm:border border-stone-200 flex flex-col overflow-hidden z-10">
        
        {/* FIXED HEADER (Compact & clean, never scrolls away) */}
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-amber-700 via-brand-600 to-amber-800 text-white relative shadow-sm">
          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-4 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-amber-200 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Smart Event Brief Assistant</span>
          </div>

          <h2 id="smart-brief-title" className="text-base sm:text-xl font-black tracking-tight text-white">
            Plan Your Celebration
          </h2>

          {/* Desktop Stepper Indicator (Compact) */}
          <div className="hidden sm:grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-white/15">
            {stepTitles.map((st) => {
              const isActive = step === st.num;
              const isPast = step > st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => {
                    if (isPast) setStep(st.num as any);
                  }}
                  disabled={!isPast && !isActive}
                  className={`text-left transition-all ${
                    isActive
                      ? 'text-white'
                      : isPast
                      ? 'text-amber-200/90 hover:text-white cursor-pointer'
                      : 'text-white/40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold mb-1">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        isActive
                          ? 'bg-amber-300 text-amber-950 shadow-sm'
                          : isPast
                          ? 'bg-amber-500/40 text-white'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {isPast ? <Check className="w-2.5 h-2.5" /> : st.num}
                    </span>
                    <span className="truncate">{st.title}</span>
                  </div>
                  <div
                    className={`h-0.5 rounded-full transition-all ${
                      isActive ? 'bg-amber-300' : isPast ? 'bg-amber-400/60' : 'bg-white/15'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Mobile Stepper: Compact & Clean */}
          <div className="sm:hidden mt-2 pt-1.5 border-t border-white/15">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-100 mb-1">
              <span>
                Step {step} of 4: {stepTitles[step - 1].title}
              </span>
              <span className="text-[10px] font-semibold text-amber-200">
                {Math.round((step / 4) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
              <div
                className="bg-amber-300 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT BODY (With ref to enforce scrollTop = 0) */}
        <div
          ref={contentRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-5 overscroll-contain scroll-smooth"
        >
          
          {/* Validation Notice Alert */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: Occasion, Guests & City */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Event Type / Occasion */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-950 bg-amber-50 border border-amber-200/90 px-3 py-1 rounded-lg mb-2.5 inline-flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span>1. What kind of event are you hosting?</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EVENT_TYPES.map((type) => {
                    const isSelected = brief.eventType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setBrief({ ...brief, eventType: type });
                          setValidationError(null);
                        }}
                        className={`p-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between text-left cursor-pointer min-h-[40px] ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-sm'
                            : 'border-stone-200 hover:border-amber-300 text-stone-700 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <span className="truncate">{type}</span>
                        {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Guest Count */}
              <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      2. Estimated Guest Count
                    </label>
                    <p className="text-[11px] text-stone-500">
                      Used to calculate venue capacity and seating density.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100/70 border border-amber-300 rounded-full text-amber-900 font-black text-xs sm:text-sm">
                    <Users className="w-3.5 h-3.5 text-amber-700" />
                    <span>{brief.guestCount || 0} Guests</span>
                  </div>
                </div>

                {/* Slider and Input Synchronized */}
                <div className="flex items-center gap-3 sm:gap-4 pt-1">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="20"
                      max="1500"
                      step="10"
                      value={brief.guestCount || 50}
                      onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      aria-label="Guest count slider"
                    />
                    <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
                      <span>20</span>
                      <span>500</span>
                      <span>1000</span>
                      <span>1500+</span>
                    </div>
                  </div>

                  <div className="shrink-0 w-24 sm:w-28">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={guestInputStr}
                      onChange={(e) => handleGuestInputChange(e.target.value)}
                      placeholder="Count"
                      className="w-full p-2.5 text-center text-sm font-bold border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-stone-900"
                      aria-label="Guest count exact number"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                    Quick Presets:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
                    {GUEST_PRESETS.map((count) => {
                      const isSelected = brief.guestCount === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => handlePresetClick(count)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer border ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:bg-amber-50/50'
                          }`}
                        >
                          {count}+
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Location / City */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  3. Preferred City / Location
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CITIES.map((c) => {
                    const isSelected = brief.city === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setBrief({ ...brief, city: c });
                          setValidationError(null);
                        }}
                        className={`p-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer min-h-[42px] ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-sm'
                            : 'border-stone-200 hover:border-amber-300 text-stone-700 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-600' : 'text-stone-400'}`} />
                          <span className="truncate">{c}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Dates, Slot, Space & Layout */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Event Date & Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Target Event Date (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={brief.date || ''}
                      onChange={(e) => setBrief({ ...brief, date: e.target.value })}
                      className="w-full p-2.5 pl-3 border border-stone-300 rounded-xl text-xs sm:text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Leave blank if your dates are still flexible.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Time Slot Preference
                  </label>
                  <select
                    value={brief.slot || 'FULL_DAY'}
                    onChange={(e) => setBrief({ ...brief, slot: e.target.value as any })}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="FULL_DAY">Full Day (10:00 AM – 11:00 PM)</option>
                    <option value="MORNING">Morning (09:00 AM – 03:00 PM)</option>
                    <option value="EVENING">Evening (05:00 PM – 11:30 PM)</option>
                    <option value="ANY">Flexible / Any Slot</option>
                  </select>
                </div>
              </div>

              {/* Space Environment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Space Environment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'INDOOR', label: 'Indoor Hall', desc: 'Climate controlled' },
                    { id: 'OUTDOOR', label: 'Outdoor Lawn', desc: 'Open air & gardens' },
                    { id: 'ANY', label: 'Both / Either', desc: 'Maximum flexibility' },
                  ].map((s) => {
                    const isSelected = (brief.spaceType || 'ANY') === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setBrief({ ...brief, spaceType: s.id as any })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer min-h-[56px] ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-sm'
                            : 'border-stone-200 hover:border-amber-300 text-stone-700 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-bold flex items-center justify-between">
                          <span>{s.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">{s.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seating Arrangement & Density */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Seating Layout & Density Efficiency
                  </label>
                  <span className="text-[11px] font-bold text-amber-700">
                    {Math.round(currentSeatingStyle.ratio * 100)}% Effective Density
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mb-2.5">
                  Different seating styles require different venue square footage per guest.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SEATING_STYLES.map((style) => {
                    const isSelected = (brief.seatingStyle || 'FLOATING') === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setBrief({ ...brief, seatingStyle: style.id })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-sm'
                            : 'border-stone-200 hover:border-amber-300 text-stone-700 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-bold">{style.label}</div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Density efficiency: {Math.round(style.ratio * 100)}%
                          </div>
                        </div>
                        <div className="shrink-0 ml-2">
                          {isSelected ? (
                            <Check className="w-4 h-4 text-amber-600" />
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-500 font-mono">
                              {Math.round(style.ratio * 100)}%
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    For <strong>{brief.guestCount || 200} guests</strong> in <strong>{currentSeatingStyle.label}</strong>, we recommend venues with standing capacity of at least <strong>~{calculatedRecommendedCapacity}</strong>.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Venue Type, Budget & Amenities */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Venue Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Venue Architecture & Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VENUE_TYPES.map((vt) => {
                    const isSelected = brief.venueType === vt;
                    return (
                      <button
                        key={vt}
                        type="button"
                        onClick={() => setBrief({ ...brief, venueType: vt })}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition text-left flex items-center justify-between cursor-pointer min-h-[42px] ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-sm'
                            : 'border-stone-200 hover:border-amber-300 text-stone-700 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <span className="truncate">{vt}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget & Catering in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Estimated Total Budget (₹)
                  </label>
                  <select
                    value={brief.budgetTotal || ''}
                    onChange={(e) =>
                      setBrief({
                        ...brief,
                        budgetTotal: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Catering Preference
                  </label>
                  <select
                    value={brief.cateringPreference || 'ANY'}
                    onChange={(e) =>
                      setBrief({ ...brief, cateringPreference: e.target.value as any })
                    }
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="ANY">Any / In-house Catering</option>
                    <option value="VEG_ONLY">Pure Vegetarian Only</option>
                    <option value="NON_VEG_ALLOWED">Non-Vegetarian Allowed</option>
                    <option value="OUTSIDE_ALLOWED">Outside Catering Permitted</option>
                  </select>
                </div>
              </div>

              {/* Special Permissions & Amenities */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Special Permissions & Amenities
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBrief({ ...brief, parkingNeeded: !brief.parkingNeeded })}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      brief.parkingNeeded
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-amber-600" />
                      <span>Dedicated Parking</span>
                    </div>
                    {brief.parkingNeeded && <Check className="w-4 h-4 text-amber-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrief({ ...brief, alcoholPermitted: !brief.alcoholPermitted })}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      brief.alcoholPermitted
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wine className="w-4 h-4 text-amber-600" />
                      <span>Alcohol Permitted</span>
                    </div>
                    {brief.alcoholPermitted && <Check className="w-4 h-4 text-amber-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrief({ ...brief, djMusicAllowed: !brief.djMusicAllowed })}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      brief.djMusicAllowed
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-amber-600" />
                      <span>DJ & Late Music</span>
                    </div>
                    {brief.djMusicAllowed && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Match */}
          {step === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-amber-950">Review Your Event Brief</h3>
                  <p className="text-xs text-amber-800/80">
                    Verify your event details before searching for verified matching venues.
                  </p>
                </div>
                <Sparkles className="w-6 h-6 text-amber-600 shrink-0" />
              </div>

              {/* Review Cards with Edit buttons */}
              <div className="space-y-3">
                {/* Event Core */}
                <div className="p-4 rounded-xl border border-stone-200 bg-white flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Event & Gathering
                    </span>
                    <div className="text-sm font-black text-stone-900">
                      {brief.eventType} • ~{brief.guestCount} Guests
                    </div>
                    <div className="text-xs text-stone-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{brief.city}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="p-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50 rounded-lg transition flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Date & Layout */}
                <div className="p-4 rounded-xl border border-stone-200 bg-white flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Schedule & Seating
                    </span>
                    <div className="text-sm font-black text-stone-900">
                      {brief.date ? brief.date : 'Flexible Date'} • {brief.slot === 'FULL_DAY' ? 'Full Day' : brief.slot === 'MORNING' ? 'Morning' : brief.slot === 'EVENING' ? 'Evening' : 'Any Slot'}
                    </div>
                    <div className="text-xs text-stone-600">
                      {currentSeatingStyle.label} ({Math.round(currentSeatingStyle.ratio * 100)}% density) • {brief.spaceType === 'INDOOR' ? 'Indoor Hall' : brief.spaceType === 'OUTDOOR' ? 'Outdoor Lawn' : 'Indoor or Outdoor'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="p-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50 rounded-lg transition flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Preferences */}
                <div className="p-4 rounded-xl border border-stone-200 bg-white flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Venue & Amenities
                    </span>
                    <div className="text-sm font-black text-stone-900">
                      {brief.venueType} {brief.budgetTotal ? `• Up to ₹${brief.budgetTotal.toLocaleString('en-IN')}` : '• Any Budget'}
                    </div>
                    <div className="text-xs text-stone-600 flex flex-wrap gap-1.5 mt-1">
                      {brief.parkingNeeded && <span className="px-2 py-0.5 rounded bg-stone-100">Parking</span>}
                      {brief.alcoholPermitted && <span className="px-2 py-0.5 rounded bg-stone-100">Alcohol</span>}
                      {brief.djMusicAllowed && <span className="px-2 py-0.5 rounded bg-stone-100">DJ / Music</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="p-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50 rounded-lg transition flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FIXED FOOTER (Always visible, never disappears) */}
        <div className="shrink-0 p-3.5 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between shadow-inner">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-xl flex items-center gap-1.5 transition cursor-pointer min-h-[42px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{step === 1 ? 'Cancel' : 'Back'}</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg flex items-center gap-2 transition cursor-pointer active:scale-98 min-h-[42px]"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-brand-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 transition cursor-pointer active:scale-98 min-h-[42px]"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Find Matching Venues</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
