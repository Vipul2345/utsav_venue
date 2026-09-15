'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Star, Calendar } from 'lucide-react';

export default function ManagerAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/manager/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-stone-400">Loading business analytics...</div>;
  }

  const occasions = data?.occasionBreakdown || {};
  const monthly = data?.monthlyRevenue || {};
  const halls = data?.hallPerformance || [];

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-amber-600" />
          <span>Performance & Analytics</span>
        </h1>
        <p className="text-xs text-stone-500">Revenue trends, booking volume by occasion, and venue occupancy insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bookings by Occasion */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-stone-900">Celebrations & Occasion Share</h3>
          <div className="space-y-2 text-xs">
            {Object.keys(occasions).length === 0 ? (
              <p className="text-stone-400 py-4 text-center">No occasion data yet.</p>
            ) : (
              Object.entries(occasions).map(([occ, count]: [string, any]) => (
                <div key={occ} className="space-y-1">
                  <div className="flex justify-between font-semibold text-stone-800">
                    <span>{occ}</span>
                    <span>{count} Bookings</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, count * 25)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-stone-900">Monthly Revenue Inflow</h3>
          <div className="space-y-3 text-xs">
            {Object.keys(monthly).length === 0 ? (
              <p className="text-stone-400 py-4 text-center">No revenue records yet.</p>
            ) : (
              Object.entries(monthly).map(([month, rev]: [string, any]) => (
                <div key={month} className="p-3 bg-stone-50 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-stone-700">{month}</span>
                  <span className="font-black text-stone-900">₹{rev.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hall Performance Comparison */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-stone-900">Venue Level Performance Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {halls.map((h: any) => (
            <div key={h.id} className="p-4 rounded-2xl border border-stone-200 space-y-2">
              <h4 className="font-extrabold text-stone-900 text-sm">{h.name}</h4>
              <p className="text-stone-500">Confirmed Bookings: <strong>{h.confirmedBookings}</strong></p>
              <p className="text-stone-500">Gross Revenue: <strong className="text-emerald-700">₹{h.totalRevenue.toLocaleString('en-IN')}</strong></p>
              <div className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{h.averageRating} ({h.reviewCount} reviews)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
