'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  CreditCard,
  Users,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  CalendarPlus,
} from 'lucide-react';

export default function ManagerDashboard() {
  const [data, setData] = useState<{
    halls: any[];
    bookings: any[];
    payments: any;
  }>({ halls: [], bookings: [], payments: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [hallsRes, bookingsRes, paymentsRes] = await Promise.all([
          fetch('/api/manager/halls'),
          fetch('/api/bookings'),
          fetch('/api/manager/payments'),
        ]);

        const [hallsData, bookingsData, paymentsData] = await Promise.all([
          hallsRes.json(),
          bookingsRes.json(),
          paymentsRes.json(),
        ]);

        setData({
          halls: hallsData.halls || [],
          bookings: bookingsData.bookings || [],
          payments: paymentsData.summary || null,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs font-bold text-stone-400">Loading manager metrics...</div>;
  }

  const approvedHalls = data.halls.filter((h) => h.status === 'APPROVED');
  const pendingHalls = data.halls.filter((h) => h.status === 'PENDING_APPROVAL');
  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingBookings = data.bookings
    .filter((b) => (b.status === 'CONFIRMED' || b.status === 'PAYMENT_PENDING') && b.eventDate >= todayStr)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase">Total Venues</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-stone-900">{data.halls.length}</p>
          <p className="text-[11px] text-emerald-700 font-semibold">
            {approvedHalls.length} Active / {pendingHalls.length} Pending Admin Review
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase">Active Bookings</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-stone-900">{data.bookings.length}</p>
          <p className="text-[11px] text-stone-500 font-semibold">
            {upcomingBookings.length} Upcoming Scheduled Events
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase">Gross Booking GMV</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-stone-900">
            ₹{(data.payments?.totalGrossRevenue || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold">
            Net Payout: ₹{(data.payments?.totalNetPayouts || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase">Quick Actions</span>
            <CalendarPlus className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <Link
              href="/manager/calendar"
              className="text-xs font-bold text-amber-700 hover:underline flex items-center justify-between"
            >
              <span>+ Record External Booking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/manager/halls/new"
              className="text-xs font-bold text-amber-700 hover:underline flex items-center justify-between"
            >
              <span>+ Add Venue Listing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Events Schedule */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-stone-900">Upcoming Confirmed Events</h2>
            <p className="text-xs text-stone-500">Upcoming celebrations scheduled across your venues</p>
          </div>
          <Link href="/manager/bookings" className="text-xs font-bold text-amber-700 hover:underline">
            View All Bookings →
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <p className="py-8 text-center text-xs text-stone-400">No upcoming bookings on schedule.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{b.hall.name}</span>
                    <span className="font-mono text-[10px] bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                      {b.bookingNumber}
                    </span>
                    {b.isExternal && (
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        External / Phone
                      </span>
                    )}
                  </div>
                  <p className="text-stone-500 mt-0.5">
                    Client: <strong>{b.customer?.fullName || b.externalCustomerName}</strong> | Occasion: {b.occasion?.name || 'Event'}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-stone-900">{b.eventDate}</p>
                    <p className="text-[11px] text-stone-500">{b.startTime} - {b.endTime}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-stone-900">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase">{b.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Managed Venues Overview */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-stone-900">Managed Banquet Halls</h2>
            <p className="text-xs text-stone-500">Overview of venue capacity, status, and pricing</p>
          </div>
          <Link href="/manager/halls" className="text-xs font-bold text-amber-700 hover:underline">
            Manage Venues →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.halls.map((hall) => (
            <div key={hall.id} className="border border-stone-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-stone-900">{hall.name}</h3>
                  <p className="text-[11px] text-stone-500">{hall.city?.name}, {hall.locality?.name}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    hall.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : hall.status === 'PENDING_APPROVAL'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {hall.status}
                </span>
              </div>

              <div className="text-xs text-stone-600 space-y-1">
                <p>Capacity: <strong>{hall.minCapacity} – {hall.maxCapacity} guests</strong></p>
                <p>Base Rental: <strong>₹{(hall.pricingRule?.baseRentalPrice || 0).toLocaleString('en-IN')}</strong></p>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <Link href={`/halls/${hall.slug || hall.id}`} className="text-stone-500 hover:underline">
                  Public Preview
                </Link>
                <Link href={`/manager/halls/${hall.id}`} className="font-bold text-amber-800 hover:underline">
                  Edit Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
