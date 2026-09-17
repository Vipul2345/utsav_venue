'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  Star,
  Award,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Heart,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

const CITIES = [
  { name: 'Bangalore', slug: 'bangalore', count: '150+ Venues' },
  { name: 'Mumbai', slug: 'mumbai', count: '120+ Venues' },
  { name: 'Delhi NCR', slug: 'delhi-ncr', count: '180+ Venues' },
  { name: 'Hyderabad', slug: 'hyderabad', count: '90+ Venues' },
  { name: 'Chennai', slug: 'chennai', count: '75+ Venues' },
];

const OCCASIONS = [
  { name: 'Weddings', slug: 'wedding', icon: '💍', desc: 'Grand marriage halls & mandaps' },
  { name: 'Receptions', slug: 'reception', icon: '🥂', desc: 'Opulent banquets & dining' },
  { name: 'Engagements', slug: 'engagement', icon: '✨', desc: 'Ring ceremonies & cocktails' },
  { name: 'Birthdays', slug: 'birthday-party', icon: '🎂', desc: 'Milestone celebrations' },
  { name: 'Corporate', slug: 'corporate-event', icon: '💼', desc: 'Conferences & galas' },
  { name: 'Cocktail Parties', slug: 'cocktail-party', icon: '🍸', desc: 'Evening music & celebrations' },
];

export default function HomePage() {
  const router = useRouter();

  // Search state
  const [cities, setCities] = useState<any[]>(CITIES);
  const [selectedCity, setSelectedCity] = useState('bangalore');
  const [selectedOccasion, setSelectedOccasion] = useState('wedding');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('300');

  // Dynamic ranking data from backend
  const [topHalls, setTopHalls] = useState<any[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);

  // Load dynamic active cities from /api/meta
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/meta');
        if (res.ok) {
          const data = await res.json();
          if (data.cities && data.cities.length > 0) {
            setCities(data.cities);
            if (!data.cities.some((c: any) => c.slug === selectedCity)) {
              setSelectedCity(data.cities[0].slug);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load cities meta:', e);
      }
    }
    loadMeta();
  }, []);

  // Fetch dynamic Top 10 halls for the selected city
  useEffect(() => {
    async function fetchTop() {
      setLoadingTop(true);
      try {
        const res = await fetch(`/api/halls/top?city=${selectedCity}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setTopHalls(data.halls || []);
        }
      } catch (e) {
        console.error('Failed to fetch top halls:', e);
      } finally {
        setLoadingTop(false);
      }
    }
    fetchTop();
  }, [selectedCity]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      city: selectedCity,
      occasion: selectedOccasion,
      date: eventDate,
      guests: guestCount,
    });
    router.push(`/search?${query.toString()}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-amber-100/30 to-transparent pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-amber-100">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Discover Top Rated Banquet Halls</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-tight">
            Reserve the Perfect Venue for Your <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-600 via-amber-700 to-amber-600 bg-clip-text text-transparent">
              Once-in-a-Lifetime Celebration
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-600 leading-relaxed">
            Real-time availability, authoritative instant pricing, zero double-bookings, and verified five-star venues across top cities.
          </p>

          {/* Search Card */}
          <div className="max-w-4xl mx-auto mt-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-amber-200 p-4 sm:p-6 text-left">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* City */}
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">
                  City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-amber-600" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {cities.map((c: any) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Occasion */}
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">
                  Occasion
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 absolute left-3 top-3 text-amber-600" />
                  <select
                    value={selectedOccasion}
                    onChange={(e) => setSelectedOccasion(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {OCCASIONS.map((o) => (
                      <option key={o.slug} value={o.slug}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">
                  Event Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-amber-600" />
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1">
                  Guest Count
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-3 text-amber-600" />
                  <input
                    type="number"
                    min="20"
                    max="5000"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    placeholder="e.g. 300"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Halls</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* City Switcher Pill Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>Top 10 Rated Halls in {cities.find((c: any) => c.slug === selectedCity)?.name || selectedCity}</span>
            </h2>
            <p className="text-xs text-stone-500">
              Ranked dynamically by verified guest ratings, capacity suitability, and booking reliability.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {cities.map((c: any) => (
              <button
                key={c.slug}
                onClick={() => setSelectedCity(c.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  selectedCity === c.slug
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Top 10 Halls Grid */}
        <div className="mt-6">
          {loadingTop ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-stone-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : topHalls.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-stone-200 p-8">
              <p className="text-sm font-semibold text-stone-700">No approved venues found in this city yet.</p>
              <Link href="/manager/halls/new" className="mt-2 inline-block text-xs font-bold text-amber-700 hover:underline">
                Are you a hall manager? List your venue now →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topHalls.map((hall, index) => (
                <div
                  key={hall.id}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Photo & Badge */}
                  <div className="relative h-52 bg-stone-100 overflow-hidden">
                    <img
                      src={hall.media?.[0]?.url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80'}
                      alt={hall.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur-sm text-white text-[11px] font-extrabold shadow">
                        #{index + 1} in {hall.city?.name}
                      </span>
                      {hall.isFeatured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-900 text-[10px] font-black uppercase tracking-wider shadow">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow text-xs font-bold text-stone-900">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{hall.averageRating}</span>
                      <span className="text-stone-400 font-normal text-[10px]">({hall.reviewCount})</span>
                    </div>

                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-stone-900/70 backdrop-blur-sm text-[11px] text-white font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>{hall.minCapacity} – {hall.maxCapacity} Guests</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-amber-800 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span>{hall.locality?.name || hall.city?.name}</span>
                      </div>

                      <h3 className="font-bold text-stone-900 text-base group-hover:text-brand-600 transition line-clamp-1">
                        {hall.name}
                      </h3>

                      <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                        {hall.description}
                      </p>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-semibold">Rental from</span>
                        <p className="text-sm font-extrabold text-stone-900">
                          ₹{(hall.pricingRule?.baseRentalPrice || 50000).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <Link
                        href={`/halls/${hall.slug || hall.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-600 hover:text-white text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Occasions Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Venues Configured For Every Celebration
          </h2>
          <p className="text-xs text-stone-500">
            Halls with verified facilities, guest accommodations, stages, and dedicated dining spaces.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {OCCASIONS.map((occ) => (
            <Link
              key={occ.slug}
              href={`/search?occasion=${occ.slug}`}
              className="p-3 sm:p-4 bg-white border border-stone-200 rounded-2xl hover:border-amber-400 hover:shadow-lg transition group text-center flex flex-col justify-between h-full space-y-2 min-h-[140px]"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto rounded-2xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center text-xl sm:text-2xl transition shrink-0">
                {occ.icon}
              </div>
              <div>
                <h4 className="font-bold text-xs text-stone-900 group-hover:text-amber-800 transition">
                  {occ.name}
                </h4>
                <p className="text-[10px] text-stone-500 line-clamp-2 mt-0.5">{occ.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust & Guarantees */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 mx-auto md:mx-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Guaranteed Slot Locking</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Zero double bookings. Intervals are locked mathematically and verified at database level during payment hold.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 mx-auto md:mx-0">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Strict Admin Approval</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Every hall and supported occasion is verified by administrators before appearing publicly.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2 mx-auto md:mx-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Transparent Server Pricing</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Authoritative breakdown for base rental, per-plate catering, add-ons, and taxes. No surprise charges.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
