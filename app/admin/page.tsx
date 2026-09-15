'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/metrics');
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
    return <div className="py-20 text-center text-xs font-bold text-stone-400">Loading marketplace metrics...</div>;
  }

  const m = data?.metrics || {};
  const cities = data?.cityDistribution || [];
  const logs = data?.recentLogs || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Marketplace Operations Overview</h1>
        <p className="text-xs text-stone-500">Live platform health, pending moderation queues, and transactional volume</p>
      </div>

      {/* Critical Moderation Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Halls */}
        <Link
          href="/admin/halls"
          className="bg-white border border-amber-300 hover:border-amber-500 rounded-2xl p-5 shadow-sm space-y-2 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase">Pending Hall Reviews</span>
            <Building2 className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
          </div>
          <p className="text-3xl font-black text-amber-600">{m.pendingHalls || 0}</p>
          <p className="text-[11px] text-stone-500 flex items-center justify-between">
            <span>Awaiting approval</span>
            <span className="font-bold text-amber-800">Moderate →</span>
          </p>
        </Link>

        {/* Pending Managers */}
        <Link
          href="/admin/managers"
          className="bg-white border border-indigo-300 hover:border-indigo-500 rounded-2xl p-5 shadow-sm space-y-2 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase">Pending Managers</span>
            <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
          </div>
          <p className="text-3xl font-black text-indigo-600">{m.pendingManagers || 0}</p>
          <p className="text-[11px] text-stone-500 flex items-center justify-between">
            <span>Document verification</span>
            <span className="font-bold text-indigo-800">Verify →</span>
          </p>
        </Link>

        {/* Total GMV */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase">Platform GMV</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-stone-900">₹{(m.totalGMV || 0).toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-emerald-700 font-semibold">{m.confirmedBookings} Confirmed Events</p>
        </div>

        {/* Platform Revenue (10% commission) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase">Platform Commission Net</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-purple-700">₹{(m.platformRevenue || 0).toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-stone-500">From verified online bookings</p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-stone-200 rounded-2xl p-5 shadow-sm text-center">
        <div>
          <span className="text-[10px] text-stone-400 font-bold uppercase block">Live Approved Halls</span>
          <span className="text-xl font-extrabold text-stone-900 mt-1 block">{m.approvedHalls || 0}</span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 font-bold uppercase block">Registered Customers</span>
          <span className="text-xl font-extrabold text-stone-900 mt-1 block">{m.totalCustomers || 0}</span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 font-bold uppercase block">Hall Managers</span>
          <span className="text-xl font-extrabold text-stone-900 mt-1 block">{m.totalManagers || 0}</span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 font-bold uppercase block">Total Bookings</span>
          <span className="text-xl font-extrabold text-stone-900 mt-1 block">{m.totalBookings || 0}</span>
        </div>
      </div>

      {/* Two Column Section: City Distribution & Recent Immutable Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City Distribution */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>Active Venues by City</span>
          </h3>

          <div className="space-y-2 text-xs">
            {cities.map((c: any) => (
              <div key={c.name} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl">
                <span className="font-semibold text-stone-800">{c.name}</span>
                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                  {c.hallCount} Venues
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Immutable System Audit Trail</span>
            </h3>
            <Link href="/admin/audit-logs" className="text-xs font-bold text-purple-700 hover:underline">
              View All Logs →
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            {logs.length === 0 ? (
              <p className="text-stone-400 py-6 text-center">No audit logs recorded yet.</p>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="p-3 bg-stone-50 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">{log.action}</span>
                      <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded font-semibold uppercase">
                        {log.entityType}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      By: {log.actor?.fullName || log.actorRole || 'SYSTEM'}
                    </p>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
