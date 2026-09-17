'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowUpRight, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/payments');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load payments ledger');
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-stone-400">Loading payments ledger...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const ledger = data?.financialLedger || [];
  const totalCommission = ledger.reduce((acc: number, b: any) => acc + (b.isExternal ? 0 : b.platformCommissionAmount), 0);
  const totalGMV = ledger.reduce((acc: number, b: any) => acc + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Platform Financial Ledger</h1>
        <p className="text-xs text-stone-500">Gross marketplace volume, 10% commission revenues, and manager disbursements</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase">Gross Booking Volume</span>
          <p className="text-3xl font-black text-stone-900">₹{totalGMV.toLocaleString('en-IN')}</p>
          <p className="text-xs text-stone-500">Total customer spending across platform</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase">Total Net Platform Revenue</span>
          <p className="text-3xl font-black text-purple-700">₹{totalCommission.toLocaleString('en-IN')}</p>
          <p className="text-xs text-stone-500">Net commission earned by marketplace</p>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-stone-200">
          <h3 className="text-sm font-bold text-stone-900">Transaction & Commission Ledger</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Reference</th>
                <th className="p-4">Venue</th>
                <th className="p-4">Event Date</th>
                <th className="p-4">Gross Customer Total</th>
                <th className="p-4">Platform Fee (10%)</th>
                <th className="p-4">Manager Disbursement</th>
                <th className="p-4">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {ledger.map((row: any) => (
                <tr key={row.id} className="hover:bg-stone-50/50 transition">
                  <td className="p-4 font-mono font-bold text-stone-900">{row.bookingNumber}</td>
                  <td className="p-4 font-semibold text-stone-800">{row.hall.name}</td>
                  <td className="p-4 text-stone-600">{row.eventDate}</td>
                  <td className="p-4 font-extrabold text-stone-900">₹{row.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="p-4 font-black text-purple-700">
                    {row.isExternal ? '₹0' : `₹${row.platformCommissionAmount.toLocaleString('en-IN')}`}
                  </td>
                  <td className="p-4 font-bold text-emerald-700">₹{row.managerPayoutAmount.toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        row.isExternal ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {row.isExternal ? 'Offline Client' : 'Marketplace Online'}
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
