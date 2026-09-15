'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, Clock, Users, Phone, MapPin, Search, Filter } from 'lucide-react';

export default function ManagerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/bookings');
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (b.customer?.fullName || b.externalCustomerName || '').toLowerCase();
      const num = b.bookingNumber.toLowerCase();
      const hall = b.hall.name.toLowerCase();
      if (!name.includes(q) && !num.includes(q) && !hall.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Reservations & Bookings</h1>
          <p className="text-xs text-stone-500">Track online verified bookings and off-platform reservations</p>
        </div>

        <Link
          href="/manager/calendar"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition"
        >
          + Record Offline Booking
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200 rounded-2xl p-4 shadow-sm text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search by client name, ref, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-semibold text-stone-700">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="PAYMENT_PENDING">Payment Hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-bold text-stone-800 text-sm">No reservations match your filters.</h3>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Venue & Occasion</th>
                  <th className="p-4">Client Contact</th>
                  <th className="p-4">Event Date & Slot</th>
                  <th className="p-4">Guests</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/50 transition">
                    <td className="p-4 font-mono font-bold text-stone-900">
                      {b.bookingNumber}
                      {b.isExternal && (
                        <span className="block text-[9px] text-purple-700 font-bold uppercase">
                          External Phone
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-stone-900">{b.hall.name}</p>
                      <p className="text-[11px] text-amber-800">{b.occasion?.name || 'Celebration'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-stone-900">
                        {b.customer?.fullName || b.externalCustomerName}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {b.customer?.phone || b.externalCustomerPhone || 'N/A'}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-stone-900">{b.eventDate}</p>
                      <p className="text-[11px] text-stone-500">{b.startTime} - {b.endTime}</p>
                    </td>
                    <td className="p-4 font-semibold text-stone-800">{b.guestCount} Guests</td>
                    <td className="p-4">
                      <p className="font-black text-stone-900">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-stone-400">Net: ₹{b.managerPayoutAmount.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'PAYMENT_PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
