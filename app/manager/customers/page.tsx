'use client';

import React, { useState, useEffect } from 'react';
import { Users, Phone, Mail, Calendar, CreditCard, Search } from 'lucide-react';

export default function ManagerCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/manager/customers');
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Customer Directory</h1>
        <p className="text-xs text-stone-500">Directory of all online guests and offline clients who booked your venues</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
        <input
          type="text"
          placeholder="Search by customer name, phone, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading customer directory...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8">
          <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <p className="text-xs text-stone-500 font-bold">No customers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.key} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm">{c.name}</h3>
                  <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-semibold mt-1 inline-block">
                    {c.isExternal ? 'Offline Client' : 'Registered Member'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  {c.name[0]?.toUpperCase()}
                </div>
              </div>

              <div className="space-y-1.5 text-stone-600">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{c.phone}</span>
                </p>
                <p className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span className="truncate">{c.email}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-stone-700">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Total Bookings</span>
                  <span className="font-extrabold text-stone-900">{c.totalBookings} Event{c.totalBookings === 1 ? '' : 's'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Total Spend</span>
                  <span className="font-extrabold text-stone-900">₹{c.totalSpent.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
