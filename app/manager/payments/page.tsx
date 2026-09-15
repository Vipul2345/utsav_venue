'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';

export default function ManagerPaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/manager/payments');
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
    return <div className="py-20 text-center text-xs text-stone-400">Loading payout records...</div>;
  }

  const summary = data?.summary || {};
  const payments = data?.payments || [];

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Earnings & Payout Ledger</h1>
        <p className="text-xs text-stone-500">Gross revenue, platform commission deductions, and net manager disbursements</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase">Gross Booking Volume</span>
          <p className="text-2xl font-black text-stone-900">₹{(summary.totalGrossRevenue || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-stone-500">Across all completed & confirmed events</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase">Platform Fees Deducted</span>
          <p className="text-2xl font-black text-rose-700">-₹{(summary.totalPlatformCommissions || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-stone-500">Standard 10% marketplace commission</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase">Net Payout to Manager</span>
          <p className="text-2xl font-black text-emerald-700">₹{(summary.totalNetPayouts || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-800 font-semibold">Processed to registered bank account</p>
        </div>
      </div>

      {/* Detailed Ledger Table */}
      <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-stone-200">
          <h3 className="text-sm font-bold text-stone-900">Disbursement Ledger</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Reference</th>
                <th className="p-4">Venue</th>
                <th className="p-4">Event Date</th>
                <th className="p-4">Gross Amount</th>
                <th className="p-4">Platform Fee</th>
                <th className="p-4">Net Manager Payout</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-stone-50/50 transition">
                  <td className="p-4 font-mono font-bold text-stone-900">{p.bookingNumber}</td>
                  <td className="p-4 font-semibold text-stone-800">{p.hallName}</td>
                  <td className="p-4 text-stone-600">{p.eventDate}</td>
                  <td className="p-4 font-bold text-stone-900">₹{p.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="p-4 font-medium text-rose-700">
                    {p.isExternal ? '₹0 (Offline)' : `-₹${p.platformCommission.toLocaleString('en-IN')}`}
                  </td>
                  <td className="p-4 font-black text-emerald-700">₹{p.netPayout.toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                      {p.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
