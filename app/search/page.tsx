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
  SlidersHorizontal,
  X,
} from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State initialized from URL params
  const [city, setCity] = useState(searchParams.get('city') || 'bangalore');
  const [locality, setLocality] = useState(searchParams.get('locality') || '');
  const [occasion, setOccasion] = useState(searchParams.get('occasion') || 'wedding');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '300');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [setting, setSetting] = useState(searchParams.get('setting') || '');
  const [hasParking, setHasParking] = useState(searchParams.get('hasParking') === 'true');
  const [alcoholAllowed, setAlcoholAllowed] = useState(searchParams.get('alcoholAllowed') === 'true');
  const [outsideCateringAllowed, setOutsideCateringAllowed] = useState(searchParams.get('outsideCateringAllowed') === 'true');
  const [outsideDecorAllowed, setOutsideDecorAllowed] = useState(searchParams.get('outsideDecorAllowed') === 'true');
  const [minRooms, setMinRooms] = useState(searchParams.get('minRooms') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'recommended');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Mobile Drawer State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  // Location Detection State
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [detectedCityNotice, setDetectedCityNotice] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please pick your city manually.');
      return;
    }

    setLocationDetecting(true);
    setLocationError(null);
    setDetectedCityNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/locations/detect?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          if (res.ok && data.detectedCity) {
            setCity(data.detectedCity.slug);
            setDetectedCityNotice(data.message);
          } else {
            setLocationError(data.error || 'Could not determine nearest city.');
          }
        } catch (err: any) {
          setLocationError(err.message || 'Failed to detect location.');
        } finally {
          setLocationDetecting(false);
        }
      },
      (geoErr) => {
        setLocationDetecting(false);
        let msg = 'Could not access your location. Please select your city manually.';
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You can search manually or enable location in browser settings.';
        } else if (geoErr.code === geoErr.TIMEOUT) {
          msg = 'Location request timed out. Please retry or pick your city manually.';
        }
        setLocationError(msg);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

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
      if (locality) params.set('locality', locality);
      if (occasion) params.set('occasion', occasion);
      if (date) params.set('date', date);
      if (guests) params.set('guests', guests);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (minRating) params.set('minRating', minRating);
      if (setting) params.set('setting', setting);
      if (hasParking) params.set('hasParking', 'true');
      if (alcoholAllowed) params.set('alcoholAllowed', 'true');
      if (outsideCateringAllowed) params.set('outsideCateringAllowed', 'true');
      if (outsideDecorAllowed) params.set('outsideDecorAllowed', 'true');
      if (minRooms) params.set('minRooms', minRooms);
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
  }, [
    city,
    locality,
    occasion,
    guests,
    minPrice,
    maxPrice,
    minRating,
    setting,
    hasParking,
    alcoholAllowed,
    outsideCateringAllowed,
    outsideDecorAllowed,
    minRooms,
    sortBy,
    selectedAmenities,
  ]);

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

  const activeFilterCount =
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minRating ? 1 : 0) +
    (locality ? 1 : 0) +
    (setting ? 1 : 0) +
    (hasParking ? 1 : 0) +
    (alcoholAllowed ? 1 : 0) +
    (outsideCateringAllowed ? 1 : 0) +
    (outsideDecorAllowed ? 1 : 0) +
    (minRooms ? 1 : 0) +
    selectedAmenities.length;

  const currentCityLocalities =
    meta.cities.find((c) => c.slug === city)?.localities || [];

  const resetAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setLocality('');
    setSetting('');
    setHasParking(false);
    setAlcoholAllowed(false);
    setOutsideCateringAllowed(false);
    setOutsideDecorAllowed(false);
    setMinRooms('');
    setSelectedAmenities([]);
  };

  const renderFiltersContent = (isMobileModal = false) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-700" />
          <span>Filters & Preferences</span>
        </h3>
        <button
          type="button"
          onClick={resetAllFilters}
          className="text-xs text-amber-800 hover:text-amber-900 hover:underline font-bold"
        >
          Reset All
        </button>
      </div>

      {/* Locality Filter (if city selected and has localities) */}
      {currentCityLocalities.length > 0 && (
        <div>
          <label
            htmlFor={isMobileModal ? 'mobile-locality-filter' : 'search-locality-filter'}
            className="block text-xs font-bold text-stone-800 mb-2"
          >
            Locality / Area
          </label>
          <select
            id={isMobileModal ? 'mobile-locality-filter' : 'search-locality-filter'}
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Localities in {meta.cities.find((c) => c.slug === city)?.name || 'City'}</option>
            {currentCityLocalities.map((loc: any) => (
              <option key={loc.id} value={loc.slug}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Setting (Indoor / Outdoor) */}
      <div>
        <span className="block text-xs font-bold text-stone-800 mb-2">Venue Setting</span>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: '', label: 'All' },
            { id: 'indoor', label: 'Indoor' },
            { id: 'outdoor', label: 'Outdoor' },
            { id: 'both', label: 'Both' },
          ].map((s) => {
            const isSelected = setting === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSetting(s.id)}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  isSelected
                    ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                    : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label
          htmlFor={isMobileModal ? 'mobile-min-price' : 'search-min-price'}
          className="block text-xs font-bold text-stone-800 mb-2"
        >
          Base Rental Budget (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={isMobileModal ? 'mobile-min-price' : 'search-min-price'} className="sr-only">
              Minimum Price in Rupees
            </label>
            <input
              id={isMobileModal ? 'mobile-min-price' : 'search-min-price'}
              type="number"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Minimum rental price"
            />
          </div>
          <div>
            <label htmlFor={isMobileModal ? 'mobile-max-price' : 'search-max-price'} className="sr-only">
              Maximum Price in Rupees
            </label>
            <input
              id={isMobileModal ? 'mobile-max-price' : 'search-max-price'}
              type="number"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Maximum rental price"
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <span className="block text-xs font-bold text-stone-800 mb-2">Minimum Rating</span>
        <div className="grid grid-cols-4 gap-1.5">
          {['Any', '4.0', '4.5', '4.8'].map((r) => {
            const isSelected = (r === 'Any' && !minRating) || minRating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setMinRating(r === 'Any' ? '' : r)}
                aria-label={r === 'Any' ? 'Show venues with any rating' : `Filter by minimum ${r} star rating`}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  isSelected
                    ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                    : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {r === 'Any' ? 'All' : `${r}★`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guest Rooms */}
      <div>
        <span className="block text-xs font-bold text-stone-800 mb-2">Guest / Bridal Rooms</span>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { value: '', label: 'Any' },
            { value: '2', label: '2+' },
            { value: '5', label: '5+' },
            { value: '10', label: '10+' },
          ].map((room) => {
            const isSelected = minRooms === room.value;
            return (
              <button
                key={room.value}
                type="button"
                onClick={() => setMinRooms(room.value)}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  isSelected
                    ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                    : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {room.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Policies & Venue Rules */}
      <div>
        <span className="block text-xs font-bold text-stone-800 mb-2">Policies & Catering</span>
        <div className="space-y-1 text-xs">
          <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 cursor-pointer text-stone-700 min-h-[40px] transition select-none">
            <input
              type="checkbox"
              checked={hasParking}
              onChange={(e) => setHasParking(e.target.checked)}
              className="rounded text-amber-700 focus:ring-amber-500 w-4 h-4 border-stone-300"
            />
            <span className="font-medium text-stone-800">Parking Space on Premises</span>
          </label>

          <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 cursor-pointer text-stone-700 min-h-[40px] transition select-none">
            <input
              type="checkbox"
              checked={outsideCateringAllowed}
              onChange={(e) => setOutsideCateringAllowed(e.target.checked)}
              className="rounded text-amber-700 focus:ring-amber-500 w-4 h-4 border-stone-300"
            />
            <span className="font-medium text-stone-800">Outside Catering Allowed</span>
          </label>

          <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 cursor-pointer text-stone-700 min-h-[40px] transition select-none">
            <input
              type="checkbox"
              checked={outsideDecorAllowed}
              onChange={(e) => setOutsideDecorAllowed(e.target.checked)}
              className="rounded text-amber-700 focus:ring-amber-500 w-4 h-4 border-stone-300"
            />
            <span className="font-medium text-stone-800">Outside Decor Allowed</span>
          </label>

          <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 cursor-pointer text-stone-700 min-h-[40px] transition select-none">
            <input
              type="checkbox"
              checked={alcoholAllowed}
              onChange={(e) => setAlcoholAllowed(e.target.checked)}
              className="rounded text-amber-700 focus:ring-amber-500 w-4 h-4 border-stone-300"
            />
            <span className="font-medium text-stone-800">Alcohol Permitted</span>
          </label>
        </div>
      </div>

      {/* Amenities */}
      {meta.amenities.length > 0 && (
        <div>
          <span className="block text-xs font-bold text-stone-800 mb-2">Amenities & Facilities</span>
          <div className="space-y-1 max-h-60 overflow-y-auto pr-1 text-xs">
            {meta.amenities.map((amen) => {
              const isChecked = selectedAmenities.includes(amen.id);
              const inputId = `${isMobileModal ? 'm-' : ''}amenity-${amen.id}`;
              return (
                <label
                  key={amen.id}
                  htmlFor={inputId}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 cursor-pointer text-stone-700 min-h-[44px] transition select-none"
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAmenity(amen.id)}
                    className="rounded text-amber-700 focus:ring-amber-500 w-5 h-5 border-stone-300"
                  />
                  <span className="font-medium text-stone-800">{amen.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {isMobileModal && (
        <div className="pt-3 border-t border-stone-100 flex gap-2">
          <button
            type="button"
            onClick={resetAllFilters}
            className="w-1/3 py-3 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-amber-700 text-white font-extrabold text-xs shadow-md hover:from-brand-700 hover:to-amber-800 transition"
          >
            Show {totalCount} Venues
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Search Header Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="search-city" className="block text-[10px] font-bold text-stone-600 uppercase tracking-wide">
                City
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locationDetecting}
                className="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition"
                title="Detect city via current GPS location"
              >
                {locationDetecting ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Detecting...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-2.5 h-2.5" />
                    <span>Detect Location</span>
                  </>
                )}
              </button>
            </div>
            <select
              id="search-city"
              aria-label="Select City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Cities</option>
              {meta.cities.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {detectedCityNotice && (
              <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center justify-between">
                <span className="line-clamp-1">{detectedCityNotice}</span>
                <button type="button" onClick={() => setDetectedCityNotice(null)} className="text-stone-400 hover:text-stone-700 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {locationError && (
              <div className="mt-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center justify-between">
                <span className="line-clamp-1">{locationError}</span>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <button type="button" onClick={handleDetectLocation} className="font-bold underline cursor-pointer">Retry</button>
                  <button type="button" onClick={() => setLocationError(null)} className="text-stone-400 hover:text-stone-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="search-occasion" className="block text-[10px] font-bold text-stone-600 uppercase tracking-wide mb-1">
              Occasion
            </label>
            <select
              id="search-occasion"
              aria-label="Select Occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            <label htmlFor="search-date" className="block text-[10px] font-bold text-stone-600 uppercase tracking-wide mb-1">
              Event Date
            </label>
            <input
              id="search-date"
              aria-label="Select Event Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="search-guests" className="block text-[10px] font-bold text-stone-600 uppercase tracking-wide mb-1">
              Guest Count
            </label>
            <input
              id="search-guests"
              aria-label="Number of Guests"
              type="number"
              min="20"
              max="5000"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="e.g. 300"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={executeSearch}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Update Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Toolbar: Filter Drawer Button + Sort (Visible on lg:hidden) */}
      <div className="lg:hidden flex items-center justify-between gap-2 bg-white border border-stone-200 rounded-2xl p-3 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 shadow-sm active:scale-95 transition"
          aria-label="Open filter options"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-700" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-800 text-white text-[10px] flex items-center justify-center font-black">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <label htmlFor="mobile-search-sort" className="sr-only">
            Sort Venues
          </label>
          <select
            id="mobile-search-sort"
            aria-label="Sort Venues"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full max-w-[170px] sm:max-w-xs px-2.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none"
          >
            <option value="recommended">Recommended</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="capacity_desc">Capacity: High to Low</option>
            <option value="rating_desc">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet / Drawer Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-700" />
                <h3 className="font-extrabold text-stone-900 text-base">Filters & Refinements</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-100"
                aria-label="Close filter drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderFiltersContent(true)}
          </div>
        </div>
      )}

      {/* Main Content Layout: Filters Sidebar + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Filters Sidebar (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-1 bg-white border border-stone-200 rounded-2xl p-5 h-fit shadow-sm">
          {renderFiltersContent(false)}
        </div>

        {/* Results Container */}
        <div className="lg:col-span-3 space-y-4">
          {/* Desktop Results Action / Sorting Bar */}
          <div className="hidden lg:flex bg-white border border-stone-200 rounded-xl px-4 py-3 items-center justify-between shadow-sm">
            <p className="text-xs font-semibold text-stone-700">
              Showing <span className="font-bold text-stone-900">{totalCount}</span> verified venue{totalCount === 1 ? '' : 's'}
              {guests && <span> matching capacity for {guests} guests</span>}
            </p>

            <div className="flex items-center gap-2">
              <label htmlFor="search-sort" className="text-[11px] text-stone-600 font-bold">
                Sort by:
              </label>
              <select
                id="search-sort"
                aria-label="Sort by options"
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
                  {/* Image with explicit responsive aspect ratio for 0 CLS */}
                  <div className="w-full sm:w-72 aspect-[16/10] sm:aspect-auto sm:h-auto relative bg-stone-100 shrink-0 overflow-hidden">
                    <img
                      src={hall.coverImage || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80'}
                      alt={hall.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {hall.isFeatured && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-amber-500 text-stone-900 text-[10px] font-black uppercase tracking-wider shadow">
                        Featured
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleFavoriteToggle(hall.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-rose-600 shadow transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Favorite"
                      aria-label={`Save ${hall.name} to favorites`}
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Info Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 mb-0.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{hall.locality?.name || hall.city?.name}, {hall.city?.name}</span>
                          </div>
                          <h3 className="font-extrabold text-base text-stone-900 group-hover:text-brand-600 transition">
                            {hall.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-900 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{hall.averageRating}</span>
                          <span className="text-[10px] text-stone-600 font-medium">({hall.reviewCount})</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2 mt-1.5 leading-relaxed">
                        {hall.description}
                      </p>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 text-[11px]">
                        <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3 text-amber-700" />
                          <span>Cap: {hall.minCapacity} – {hall.maxCapacity} Guests</span>
                        </span>

                        {hall.hasParking && (
                          <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 font-medium">
                            Parking ({hall.parkingCapacity || 50}+ cars)
                          </span>
                        )}

                        {hall.roomsCount > 0 && (
                          <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 font-medium">
                            {hall.roomsCount} Bridal/Guest Rooms
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing & CTA footer */}
                    <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-baseline gap-3">
                        <div>
                          <span className="text-[10px] text-stone-600 uppercase font-bold block">Hall Rental</span>
                          <span className="text-base font-black text-stone-900">
                            ₹{(hall.pricingRule?.baseRentalPrice || 50000).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {hall.pricingRule?.perPlateVegPrice > 0 && (
                          <div className="border-l border-stone-200 pl-3">
                            <span className="text-[10px] text-stone-600 uppercase font-bold block">Catering from</span>
                            <span className="text-xs font-bold text-stone-800">
                              ₹{hall.pricingRule.perPlateVegPrice}/plate
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            const destination =
                              hall.latitude && hall.longitude
                                ? `${hall.latitude},${hall.longitude}`
                                : encodeURIComponent(`${hall.name}, ${hall.address}, ${hall.city?.name}`);
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
                              '_blank',
                              'noopener,noreferrer'
                            );
                          }}
                          className="w-full sm:w-auto px-3.5 py-2.5 border border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0"
                          title="Get Directions & Location on Google Maps"
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Get Location</span>
                        </button>

                        <Link
                          href={`/halls/${hall.slug || hall.id}`}
                          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-brand-600 to-amber-700 hover:from-brand-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1 min-h-[44px] sm:min-h-0"
                        >
                          <span>Check Dates & Pricing</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
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
