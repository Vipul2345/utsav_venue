'use client';

import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AdminSettingsPage() {
  const [commissionPercent, setCommissionPercent] = useState('10');
  const [defaultTaxPercent, setDefaultTaxPercent] = useState('18');
  const [holdMinutes, setHoldMinutes] = useState('10');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-600" />
          <span>Platform Operational Settings</span>
        </h1>
        <p className="text-xs text-stone-500">Configure global marketplace commission, payment hold duration, and tax defaults</p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Platform settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-xs">
        <div className="space-y-4">
          <div>
            <label className="block font-bold text-stone-900 mb-1">Standard Platform Commission (%)</label>
            <p className="text-stone-500 text-[11px] mb-2">
              Percentage deducted from online bookings and retained as platform revenue.
            </p>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                min="0"
                max="50"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900"
              />
              <span className="font-bold text-stone-500">%</span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <label className="block font-bold text-stone-900 mb-1">Temporary Slot Hold Duration (Minutes)</label>
            <p className="text-stone-500 text-[11px] mb-2">
              Duration for which a slot is locked during checkout in PAYMENT_PENDING status. If unpaid, the hold releases.
            </p>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                min="3"
                max="60"
                value={holdMinutes}
                onChange={(e) => setHoldMinutes(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900"
              />
              <span className="font-bold text-stone-500">Mins</span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <label className="block font-bold text-stone-900 mb-1">Default GST / Tax Rate (%)</label>
            <p className="text-stone-500 text-[11px] mb-2">
              Statutory GST rate applied on venue hire and catering services.
            </p>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                min="0"
                max="28"
                value={defaultTaxPercent}
                onChange={(e) => setDefaultTaxPercent(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900"
              />
              <span className="font-bold text-stone-500">%</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Platform Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
