'use client';

import React, { useEffect } from 'react';
import { X, SlidersHorizontal, Check, Building, Users, Sparkles, ShieldCheck, Car, Wine, UtensilsCrossed, Palette, BedDouble, Star } from 'lucide-react';
import { VENUE_TYPES, SEATING_STYLES } from '@/lib/types/eventBrief';

export interface EventFiltersState {
  city?: string;
  occasion?: string;
  venueType?: string;
  seating?: string;
  guests?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  setting?: string;
  hasParking?: boolean;
  alcoholAllowed?: boolean;
  outsideCateringAllowed?: boolean;
  outsideDecorAllowed?: boolean;
  minRooms?: string;
}

export interface EventFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: EventFiltersState;
  onChange: (newFilters: Partial<EventFiltersState>) => void;
  onReset: () => void;
  onApply: () => void;
}

export default function EventFilterDrawer({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
  onApply,
}: EventFilterDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft">
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-semibold">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Adaptive Filters</h2>
                <p className="text-xs text-stone-500">
                  {filters.occasion ? `Tuned for ${filters.occasion}` : 'Refine venue specs & layout'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-stone-800">
            {/* Event Context Pill if present */}
            {(filters.occasion || filters.guests) && (
              <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Smart Criteria: {filters.occasion || 'General Event'}
                    {filters.guests ? ` • ~${filters.guests} Guests` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Venue Type */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2.5">
                Venue Architecture & Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {VENUE_TYPES.map((type) => {
                  const isSelected = filters.venueType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onChange({ venueType: isSelected ? '' : type })}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <span className="truncate">{type}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seating Style & Density */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Seating Layout / Density
                </label>
              </div>
              <p className="text-[11px] text-stone-400 mb-2.5">
                Automatically adjusts calculated venue capacity based on arrangement.
              </p>
              <div className="space-y-1.5">
                {SEATING_STYLES.map((style) => {
                  const isSelected = filters.seating === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => onChange({ seating: isSelected ? '' : style.id })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{style.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-mono">
                          {Math.round(style.ratio * 100)}% density
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Space Setting (Indoor / Outdoor) */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2">
                Space Environment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '', label: 'Any' },
                  { id: 'indoor', label: 'Indoor' },
                  { id: 'outdoor', label: 'Outdoor' },
                ].map((s) => {
                  const isSelected = (filters.setting || '') === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onChange({ setting: s.id })}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm font-semibold'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Policies & Essential Amenities */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2.5">
                Policies & Amenities
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!filters.hasParking}
                    onChange={(e) => onChange({ hasParking: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                  />
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-700">
                    <Car className="w-4 h-4 text-stone-400" />
                    <span>Dedicated Parking Available</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!filters.alcoholAllowed}
                    onChange={(e) => onChange({ alcoholAllowed: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                  />
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-700">
                    <Wine className="w-4 h-4 text-stone-400" />
                    <span>Alcohol Permitted</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!filters.outsideCateringAllowed}
                    onChange={(e) => onChange({ outsideCateringAllowed: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                  />
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-700">
                    <UtensilsCrossed className="w-4 h-4 text-stone-400" />
                    <span>Outside Catering Allowed</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!filters.outsideDecorAllowed}
                    onChange={(e) => onChange({ outsideDecorAllowed: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                  />
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-700">
                    <Palette className="w-4 h-4 text-stone-400" />
                    <span>Outside Decorator Allowed</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Minimum Guest Rooms */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2">
                Guest Rooms (For Stay / Destination)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: '', label: 'Any' },
                  { value: '5', label: '5+' },
                  { value: '10', label: '10+' },
                  { value: '20', label: '20+' },
                ].map((r) => {
                  const isSelected = (filters.minRooms || '') === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => onChange({ minRooms: r.value })}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500 font-semibold'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimum Star Rating */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2">
                Minimum Rating
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: '', label: 'Any' },
                  { value: '4', label: '4.0+ ★' },
                  { value: '4.5', label: '4.5+ ★' },
                ].map((rat) => {
                  const isSelected = (filters.minRating || '') === rat.value;
                  return (
                    <button
                      key={rat.value}
                      type="button"
                      onClick={() => onChange({ minRating: rat.value })}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500 font-semibold'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {rat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-300 rounded-xl hover:bg-stone-100 transition-colors"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={() => {
                onApply();
                onClose();
              }}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
            >
              Apply Filter Criteria
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
