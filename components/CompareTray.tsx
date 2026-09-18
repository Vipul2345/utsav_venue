'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';

export interface ComparedVenueItem {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  city?: string | null;
}

const STORAGE_KEY = 'utsav_compare_venues';

export function getComparedVenues(): ComparedVenueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addVenueToCompare(venue: ComparedVenueItem): boolean {
  if (typeof window === 'undefined') return false;
  const current = getComparedVenues();
  if (current.some((v) => v.id === venue.id || v.slug === venue.slug)) {
    return false;
  }
  if (current.length >= 4) {
    alert('You can compare up to 4 venues simultaneously.');
    return false;
  }
  const updated = [...current, venue];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('utsav_compare_updated'));
  return true;
}

export function removeVenueFromCompare(id: string) {
  if (typeof window === 'undefined') return;
  const current = getComparedVenues();
  const updated = current.filter((v) => v.id !== id && v.slug !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('utsav_compare_updated'));
}

export function clearComparedVenues() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('utsav_compare_updated'));
}

export function isVenueCompared(id: string): boolean {
  const current = getComparedVenues();
  return current.some((v) => v.id === id || v.slug === id);
}

export default function CompareTray() {
  const router = useRouter();
  const [venues, setVenues] = useState<ComparedVenueItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const sync = () => {
    setVenues(getComparedVenues());
  };

  useEffect(() => {
    setMounted(true);
    sync();
    window.addEventListener('utsav_compare_updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('utsav_compare_updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!mounted || venues.length === 0) return null;

  const compareUrl = `/compare?ids=${venues.map((v) => v.id).join(',')}`;
  const canCompare = venues.length >= 2;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-amber-200 shadow-2xl animate-slide-up">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Info and Clear */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                Compare Venues
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {venues.length}/4
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                {canCompare
                  ? 'Ready to generate side-by-side comparison matrix'
                  : 'Add at least 1 more venue to compare'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearComparedVenues}
            className="text-xs text-gray-400 hover:text-red-600 transition flex items-center gap-1 sm:ml-4"
            title="Clear all selected"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Clear</span>
          </button>
        </div>

        {/* Center: Selected Venue Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto py-1 sm:py-0">
          {venues.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 pl-1.5 pr-2 py-1 rounded-xl shrink-0 group relative shadow-xs"
            >
              {v.image ? (
                <img
                  src={v.image}
                  alt={v.name}
                  className="w-7 h-7 rounded-lg object-cover bg-gray-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  {v.name[0]}
                </div>
              )}
              <span className="text-xs font-semibold text-gray-800 max-w-[100px] truncate">
                {v.name}
              </span>
              <button
                type="button"
                onClick={() => removeVenueFromCompare(v.id)}
                className="text-gray-400 hover:text-red-500 p-0.5 rounded-md hover:bg-white transition"
                aria-label={`Remove ${v.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Placeholders if < 4 */}
          {Array.from({ length: Math.max(0, 2 - venues.length) }).map((_, idx) => (
            <div
              key={idx}
              className="hidden sm:flex items-center justify-center border border-dashed border-gray-300 px-3 py-1.5 rounded-xl text-[11px] text-gray-400 shrink-0"
            >
              + Select Venue
            </div>
          ))}
        </div>

        {/* Right: Compare Action CTA */}
        <div className="w-full sm:w-auto flex justify-end">
          {canCompare ? (
            <Link
              href={compareUrl}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition"
            >
              Compare Now ({venues.length})
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-200 text-gray-400 font-semibold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              Select 2+ to Compare
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
