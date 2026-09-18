'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scale,
  Sparkles,
  Check,
  X,
  Star,
  Users,
  Building,
  Car,
  Wine,
  Utensils,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Info,
  Layers,
  Award,
} from 'lucide-react';
import CompareTray, { removeVenueFromCompare } from '@/components/CompareTray';
import SmartEventBriefModal from '@/components/SmartEventBriefModal';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [smartBriefOpen, setSmartBriefOpen] = useState(false);

  const ids = searchParams.get('ids');
  const guests = searchParams.get('guests');
  const date = searchParams.get('date');
  const eventType = searchParams.get('eventType');

  useEffect(() => {
    if (!ids) {
      setLoading(false);
      return;
    }

    const fetchComparison = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = searchParams.toString();
        const res = await fetch(`/api/compare?${query}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch comparison');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [searchParams, ids]);

  const handleRemoveVenue = (venueId: string) => {
    removeVenueFromCompare(venueId);
    if (!data?.venues) return;
    const remaining = data.venues.filter((v: any) => v.id !== venueId);
    if (remaining.length < 2) {
      router.push('/search');
    } else {
      const newIds = remaining.map((v: any) => v.id).join(',');
      const params = new URLSearchParams(searchParams.toString());
      params.set('ids', newIds);
      router.push(`/compare?${params.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-lg font-bold text-gray-800">Generating Venue Comparison...</h3>
        <p className="text-sm text-gray-500 mt-1">Normalizing dimensions, capacities, and pricing models</p>
      </div>
    );
  }

  if (error || !data || !data.venues || data.venues.length < 2) {
    return (
      <div className="min-h-[70vh] max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Scale className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Compare Venues Side-by-Side</h2>
        <p className="text-gray-600 text-sm max-w-md mx-auto mb-8">
          {error || 'Select at least 2 venues (up to 4) from our directory to compare pricing, capacity, amenities, and policies.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/search"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition"
          >
            Explore Venues
          </Link>
          <button
            type="button"
            onClick={() => setSmartBriefOpen(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-brand-600 text-brand-700 hover:bg-brand-50 font-bold text-sm transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Smart Event Match
          </button>
        </div>

        <SmartEventBriefModal
          isOpen={smartBriefOpen}
          onClose={() => setSmartBriefOpen(false)}
        />
      </div>
    );
  }

  const { venues, highlights } = data;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-amber-900 to-brand-950 text-white py-8 px-4 border-b border-amber-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
                <Scale className="w-4 h-4" />
                Side-by-Side Comparison Matrix
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                Comparing {venues.length} Venues
              </h1>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                Objective specifications, layout capacities, and transparent pricing
              </p>
            </div>

            {/* Event Context Pill if set */}
            {(guests || eventType || date) && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl text-xs space-y-1">
                <div className="text-amber-200 font-bold uppercase tracking-wider text-[10px]">
                  Applied Event Context
                </div>
                <div className="flex items-center gap-3 text-white">
                  {eventType && <span>🎉 {eventType}</span>}
                  {guests && <span>👥 {guests} Guests</span>}
                  {date && <span>📅 {date}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            {/* Header Cards Row */}
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="p-4 w-48 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Venue Overview
                </th>
                {venues.map((v: any) => {
                  const isLowestPrice = highlights?.lowestPriceHallId === v.id;
                  const isHighestRating = highlights?.highestRatingHallId === v.id;
                  const isLargest = highlights?.largestCapacityHallId === v.id;

                  return (
                    <th key={v.id} className="p-4 align-top w-72 min-w-[260px] relative">
                      {/* Close button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveVenue(v.id)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Cover Photo */}
                      <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-gray-200">
                        {v.coverImage ? (
                          <img
                            src={v.coverImage}
                            alt={v.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No photo
                          </div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {v.venueType}
                        </span>
                      </div>

                      {/* Winner Badge if applicable */}
                      {isLowestPrice && (
                        <div className="mb-2 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          <Award className="w-3 h-3 text-emerald-600" />
                          Best Value Estimate
                        </div>
                      )}
                      {isHighestRating && !isLowestPrice && (
                        <div className="mb-2 inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          Highest Rated
                        </div>
                      )}
                      {isLargest && !isLowestPrice && !isHighestRating && (
                        <div className="mb-2 inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                          <Users className="w-3 h-3 text-blue-600" />
                          Largest Capacity
                        </div>
                      )}

                      <h3 className="font-bold text-gray-900 text-base leading-snug">
                        <Link href={`/halls/${v.slug || v.id}`} className="hover:text-brand-600">
                          {v.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {v.locality ? `${v.locality}, ` : ''}{v.city}
                      </p>

                      <div className="flex items-center gap-1 mt-1 text-xs">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-gray-800">{v.averageRating}</span>
                        <span className="text-gray-400">({v.reviewCount} reviews)</span>
                      </div>

                      <div className="mt-3">
                        <Link
                          href={`/halls/${v.slug || v.id}`}
                          className="w-full block text-center py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-xs"
                        >
                          View Details
                        </Link>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Comparison Matrix Data Rows */}
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm text-gray-700">
              {/* SECTION: Pricing & Estimated Cost */}
              <tr className="bg-amber-50/40">
                <td
                  colSpan={venues.length + 1}
                  className="p-3 font-bold text-amber-900 text-xs uppercase tracking-wider"
                >
                  1. Transparent Pricing & Cost Estimation
                </td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Base Daily Rental</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4 font-bold text-gray-900">
                    ₹{v.basePrice.toLocaleString('en-IN')}
                    <span className="block text-[11px] font-normal text-gray-500">per day base rent</span>
                  </td>
                ))}
              </tr>

              {guests && (
                <tr className="bg-brand-50/30">
                  <td className="p-4 font-semibold text-brand-900">
                    Estimated Total ({guests} Guests)
                  </td>
                  {venues.map((v: any) => (
                    <td key={v.id} className="p-4 font-bold text-brand-700 text-base">
                      {v.estimatedCost ? (
                        <>
                          ₹{v.estimatedCost.toLocaleString('en-IN')}
                          {v.breakdown?.bulkDiscountAmount > 0 && (
                            <span className="block text-[11px] font-normal text-emerald-600">
                              Includes bulk discount: -₹{v.breakdown.bulkDiscountAmount.toLocaleString('en-IN')}
                            </span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  ))}
                </tr>
              )}

              <tr>
                <td className="p-4 font-semibold text-gray-900">Weekend Surcharge</td>
                {venues.map((v: any) => {
                  const mult = v.pricingRule?.weekendMultiplier || 1.0;
                  const surcharge = Math.round((mult - 1) * 100);
                  return (
                    <td key={v.id} className="p-4">
                      {surcharge > 0 ? `+${surcharge}% on weekends` : 'No weekend surcharge'}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Refundable Security Deposit</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4">
                    ₹{(v.pricingRule?.securityDeposit || 0).toLocaleString('en-IN')}
                  </td>
                ))}
              </tr>

              {/* SECTION: Capacity & Seating Layouts */}
              <tr className="bg-amber-50/40">
                <td
                  colSpan={venues.length + 1}
                  className="p-3 font-bold text-amber-900 text-xs uppercase tracking-wider"
                >
                  2. Capacity & Seating Layouts
                </td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Maximum Guest Capacity</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4 font-bold text-gray-900">
                    {v.maxCapacity} Guests
                    <span className="block text-[11px] font-normal text-gray-500">
                      Min: {v.minCapacity}
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Theatre / Auditorium Layout</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4">
                    ~{Math.round(v.maxCapacity * 0.85)} seats
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Round Table / Banquet Layout</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4">
                    ~{Math.round(v.maxCapacity * 0.65)} guests
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Indoor Area (Sq. Ft.)</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4">
                    {v.indoorAreaSqFt ? `${v.indoorAreaSqFt.toLocaleString()} sq.ft.` : 'N/A'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Outdoor Lawn Area</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4">
                    {v.outdoorAreaSqFt ? `${v.outdoorAreaSqFt.toLocaleString()} sq.ft.` : 'None'}
                  </td>
                ))}
              </tr>

              {/* SECTION: Facilities & Rooms */}
              <tr className="bg-amber-50/40">
                <td
                  colSpan={venues.length + 1}
                  className="p-3 font-bold text-amber-900 text-xs uppercase tracking-wider"
                >
                  3. Facilities & Rooms
                </td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Complimentary Rooms</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4 font-semibold">
                    {v.roomsCount} Rooms (Air Conditioned)
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Parking Capacity</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4">
                    {v.hasParking
                      ? `Yes (${v.parkingCapacity || 50} vehicles)`
                      : 'Street Parking Only'}
                  </td>
                ))}
              </tr>

              {/* SECTION: Policies & Permissions */}
              <tr className="bg-amber-50/40">
                <td
                  colSpan={venues.length + 1}
                  className="p-3 font-bold text-amber-900 text-xs uppercase tracking-wider"
                >
                  4. Policies & Rules
                </td>
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Outside Catering</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4">
                    {v.policies.outsideCateringAllowed ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Allowed
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center gap-1">
                        <X className="w-4 h-4 text-red-500" /> In-house Only
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Outside Decorators</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4">
                    {v.policies.outsideDecorAllowed ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Allowed
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center gap-1">
                        <X className="w-4 h-4 text-red-500" /> In-house Only
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Alcohol Permitted</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4">
                    {v.policies.alcoholAllowed ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Permitted (with license)
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center gap-1">
                        <X className="w-4 h-4 text-red-500" /> Prohibited
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-900">Cancellation & Refund</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4">
                    <span className="font-semibold text-gray-800">
                      {v.policies.refundPercentage}% Refund
                    </span>
                    <span className="block text-[11px] text-gray-500">
                      Up to {v.policies.cancellationDeadlineHours} hours before event
                    </span>
                  </td>
                ))}
              </tr>

              {/* Bottom Actions Row */}
              <tr>
                <td className="p-4 font-bold text-gray-900">Take Action</td>
                {venues.map((v: any) => (
                  <td key={v.id} className="p-4">
                    <Link
                      href={`/halls/${v.slug || v.id}#quote`}
                      className="w-full block text-center py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-bold text-xs shadow-md transition"
                    >
                      Request Quote
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <CompareTray />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
