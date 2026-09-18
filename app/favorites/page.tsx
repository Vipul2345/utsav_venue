'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Star, MapPin, Users, ChevronRight, Search, Scale, ArrowRight } from 'lucide-react';
import CompareTray, {
  addVenueToCompare,
  removeVenueFromCompare,
  isVenueCompared,
  getComparedVenues,
} from '@/components/CompareTray';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparedIds, setComparedIds] = useState<string[]>([]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
    const sync = () => {
      setComparedIds(getComparedVenues().map((v) => v.id));
    };
    sync();
    window.addEventListener('utsav_compare_updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('utsav_compare_updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const removeFavorite = async (hallId: string) => {
    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hallId }),
      });
      setFavorites((prev) => prev.filter((f) => f.hallId !== hallId));
    } catch (e) {
      console.error(e);
    }
  };

  const compareAllUrl = `/compare?ids=${favorites
    .slice(0, 4)
    .map((f) => f.hall.id)
    .join(',')}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-600 fill-rose-600" />
            <span>Saved Venues</span>
          </h1>
          <p className="text-xs text-stone-500">
            Shortlisted banquet halls for your upcoming celebrations
          </p>
        </div>

        {favorites.length >= 2 && (
          <Link
            href={compareAllUrl}
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-amber-700 hover:from-brand-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Compare Shortlist ({Math.min(4, favorites.length)})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-bold text-stone-400">Loading saved venues...</div>
      ) : favorites.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
          <Heart className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-bold text-stone-800 text-sm">No saved venues yet.</h3>
          <p className="text-xs text-stone-400">Tap the heart icon on any venue card to save it to your shortlist.</p>
          <Link href="/search" className="inline-block mt-2 text-xs font-bold text-amber-700 hover:underline">
            Explore Venues →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((f) => {
            const hall = f.hall;
            const isComparing = comparedIds.includes(hall.id);

            return (
              <div
                key={f.id}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="relative h-48 bg-stone-100">
                  <img
                    src={hall.media?.[0]?.url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80'}
                    alt={hall.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFavorite(hall.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-rose-600 shadow min-w-[36px] min-h-[36px] flex items-center justify-center transition"
                    title="Remove from favorites"
                    aria-label="Remove from favorites"
                  >
                    <Heart className="w-4 h-4 fill-rose-600" />
                  </button>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-amber-800">
                      {hall.locality?.name || hall.city?.name}, {hall.city?.name}
                    </span>
                    <h3 className="font-bold text-stone-900 text-sm mt-0.5 line-clamp-1">{hall.name}</h3>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1">{hall.description}</p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">Rental from</span>
                      <span className="text-sm font-black text-stone-900">
                        ₹{(hall.pricingRule?.baseRentalPrice || 50000).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isComparing) {
                            removeVenueFromCompare(hall.id);
                          } else {
                            addVenueToCompare({
                              id: hall.id,
                              name: hall.name,
                              slug: hall.slug,
                              image: hall.media?.[0]?.url,
                              city: hall.city?.name,
                            });
                          }
                        }}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1 ${
                          isComparing
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                        }`}
                        title={isComparing ? 'Remove from compare' : 'Add to compare'}
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>{isComparing ? 'Comparing' : 'Compare'}</span>
                      </button>

                      <Link
                        href={`/halls/${hall.slug || hall.id}`}
                        className="px-3.5 py-2 min-h-[40px] bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl transition flex items-center gap-1"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Compare Tray */}
      <CompareTray />
    </div>
  );
}
