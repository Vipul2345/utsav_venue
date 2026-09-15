'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, Clock, MapPin, Search, AlertCircle, FileText } from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/bookings');
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
    const q = search.toLowerCase();
    const client = (b.customer?.fullName || b.externalCustomerName || '').toLowerCase();
    const venue = b.hall.name.toLowerCase();
    const ref = b.bookingNumber.toLowerCase();
    return client.includes(q) || venue.includes(q) || ref.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Platform-Wide Bookings Oversight</h1>
        <p className="text-xs text-stone-500">Monitor all online and external venue reservations across the platform</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
        <input
          type="text"
          placeholder="Search by client, venue, or reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-bold text-sm text-stone-800">No bookings found.</h3>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Venue & City</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Event Date & Slot</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Platform Fee</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Receipt</th>
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
                      <p className="font-extrabold text-stone-900">{b.hall.name}</p>
                      <p className="text-[11px] text-stone-500">{b.hall.city?.name}</p>
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
                    <td className="p-4 font-black text-stone-900">₹{b.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-bold text-purple-700">
                      ₹{b.platformCommissionAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
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
                    <td className="p-4 text-right">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-bold"
                      >
                        Voucher
                      </Link>
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
