'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Star,
  Filter,
  ArrowUpDown,
  Check,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Heart,
} from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State initialized from URL params
  const [city, setCity] = useState(searchParams.get('city') || 'bangalore');
  const [occasion, setOccasion] = useState(searchParams.get('occasion') || 'wedding');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '300');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'recommended');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Metadata from backend
  const [meta, setMeta] = useState<{ cities: any[]; occasions: any[]; amenities: any[] }>({
    cities: [],
    occasions: [],
    amenities: [],
  });

  // Results
  const [halls, setHalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch meta on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/meta');
        if (res.ok) {
          const data = await res.json();
          setMeta(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, []);

  // Fetch search results whenever filters change
  const executeSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (occasion) params.set('occasion', occasion);
      if (date) params.set('date', date);
      if (guests) params.set('guests', guests);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (minRating) params.set('minRating', minRating);
      if (sortBy) params.set('sortBy', sortBy);
      if (selectedAmenities.length > 0) params.set('amenities', selectedAmenities.join(','));

      const res = await fetch(`/api/halls?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHalls(data.halls || []);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (e) {
      console.error('Failed to search halls:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [city, occasion, guests, minPrice, maxPrice, minRating, sortBy, selectedAmenities]);

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleFavoriteToggle = async (hallId: string) => {
    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hallId }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Header Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Cities</option>
              {meta.cities.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">
              Occasion
            </label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Occasions</option>
              {meta.occasions.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">
              Event Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">
              Guest Count
            </label>
            <input
              type="number"
              min="20"
              max="5000"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="e.g. 300"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={executeSearch}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Update Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Filters Sidebar + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6 bg-white border border-stone-200 rounded-2xl p-5 h-fit shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-600" />
              <span>Filters</span>
            </h3>
            <button
              onClick={() => {
                setMinPrice('');
                setMaxPrice('');
                setMinRating('');
                setSelectedAmenities([]);
              }}
              className="text-[11px] text-amber-700 hover:underline font-semibold"
            >
              Reset All
            </button>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-2">Base Rental Budget (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-2">Minimum Rating</label>
            <div className="grid grid-cols-4 gap-1">
              {['Any', '4.0', '4.5', '4.8'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMinRating(r === 'Any' ? '' : r)}
                  className={`py-1 text-xs font-semibold rounded-lg border transition ${
                    (r === 'Any' && !minRating) || minRating === r
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {r === 'Any' ? 'All' : `${r}★`}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          {meta.amenities.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2">Amenities & Facilities</label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
                {meta.amenities.map((amen) => {
                  const isChecked = selectedAmenities.includes(amen.id);
                  return (
                    <label
                      key={amen.id}
                      className="flex items-center gap-2 cursor-pointer hover:text-stone-900 text-stone-600 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAmenity(amen.id)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                      />
                      <span>{amen.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results Container */}
        <div className="lg:col-span-3 space-y-4">
          {/* Results Action / Sorting Bar */}
          <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
            <p className="text-xs font-semibold text-stone-700">
              Showing <span className="font-bold text-stone-900">{totalCount}</span> verified venue{totalCount === 1 ? '' : 's'}
              {guests && <span> matching capacity for {guests} guests</span>}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none"
              >
                <option value="recommended">Recommended & Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="capacity_desc">Capacity: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Venues Grid */}
          {loading ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-stone-200">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
              <p className="text-xs font-semibold text-stone-600">Finding matching verified banquet halls...</p>
            </div>
          ) : halls.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Couldn't find venues matching your requirements.</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try widening your guest count range, expanding budget, or choosing another nearby city.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {halls.map((hall) => (
                <div
                  key={hall.id}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col sm:flex-row group"
                >
                  {/* Image */}
                  <div className="sm:w-72 h-52 sm:h-auto relative bg-stone-100 shrink-0">
                    <img
                      src={hall.coverImage || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80'}
                      alt={hall.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {hall.isFeatured && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-amber-500 text-stone-900 text-[10px] font-black uppercase tracking-wider shadow">
                        Featured
                      </span>
                    )}

                    <button
                      onClick={() => handleFavoriteToggle(hall.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-rose-600 shadow transition"
                      title="Favorite"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Info Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-800 mb-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{hall.locality?.name || hall.city?.name}, {hall.city?.name}</span>
                          </div>
                          <h3 className="font-extrabold text-base text-stone-900 group-hover:text-brand-600 transition">
                            {hall.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-xs font-bold text-amber-900 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{hall.averageRating}</span>
                          <span className="text-[10px] text-stone-400 font-normal">({hall.reviewCount})</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                        {hall.description}
                      </p>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                        <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3 text-amber-600" />
                          <span>Cap: {hall.minCapacity} – {hall.maxCapacity} Guests</span>
                        </span>

                        {hall.hasParking && (
                          <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                            Parking ({hall.parkingCapacity || 50}+ cars)
                          </span>
                        )}

                        {hall.roomsCount > 0 && (
                          <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                            {hall.roomsCount} Bridal/Guest Rooms
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing & CTA footer */}
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-baseline gap-3">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-semibold block">Hall Rental</span>
                          <span className="text-base font-black text-stone-900">
                            ₹{(hall.pricingRule?.baseRentalPrice || 50000).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {hall.pricingRule?.perPlateVegPrice > 0 && (
                          <div className="border-l border-stone-200 pl-3">
                            <span className="text-[10px] text-stone-400 uppercase font-semibold block">Catering from</span>
                            <span className="text-xs font-bold text-stone-700">
                              ₹{hall.pricingRule.perPlateVegPrice}/plate
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/halls/${hall.slug || hall.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1"
                      >
                        <span>Check Dates & Pricing</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-stone-400">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
