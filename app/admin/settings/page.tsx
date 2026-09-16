'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [commissionPercent, setCommissionPercent] = useState('10');
  const [defaultTaxPercent, setDefaultTaxPercent] = useState('18');
  const [holdMinutes, setHoldMinutes] = useState('10');
  const [maxHallImages, setMaxHallImages] = useState('5');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setCommissionPercent(data.settings.commissionPercent.toString());
            setDefaultTaxPercent(data.settings.defaultTaxPercent.toString());
            setHoldMinutes(data.settings.holdMinutes.toString());
            setMaxHallImages(data.settings.maxHallImages.toString());
          }
        }
      } catch (err: any) {
        console.error('Failed to load admin settings', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionPercent,
          holdMinutes,
          defaultTaxPercent,
          maxHallImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-600" />
          <span>Platform Operational Settings</span>
        </h1>
        <p className="text-xs text-stone-500">
          Configure global marketplace commission, payment hold duration, tax defaults, and hall media quotas
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">Platform settings updated and persisted successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-xs">
        <div className="space-y-4">
          <div>
            <label className="block font-bold text-stone-900 mb-1">Standard Platform Commission (%)</label>
            <p className="text-stone-500 text-[11px] mb-2">
              Percentage deducted from online customer bookings and retained as marketplace platform revenue.
            </p>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                disabled={loading || saving}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 disabled:opacity-50"
              />
              <span className="font-bold text-stone-500">%</span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <label className="block font-bold text-stone-900 mb-1">Temporary Slot Hold Duration (Minutes)</label>
            <p className="text-stone-500 text-[11px] mb-2">
              Duration for which a date/slot is locked during checkout in PAYMENT_PENDING status before automatic expiration.
            </p>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                min="3"
                max="60"
                value={holdMinutes}
                onChange={(e) => setHoldMinutes(e.target.value)}
                disabled={loading || saving}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 disabled:opacity-50"
              />
              <span className="font-bold text-stone-500">Mins</span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <label className="block font-bold text-stone-900 mb-1">Default GST / Tax Rate (%)</label>
            <p className="text-stone-500 text-[11px] mb-2">
              Statutory GST rate applied on venue rental tariffs and catering services.
            </p>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                min="0"
                max="28"
                step="0.5"
                value={defaultTaxPercent}
                onChange={(e) => setDefaultTaxPercent(e.target.value)}
                disabled={loading || saving}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 disabled:opacity-50"
              />
              <span className="font-bold text-stone-500">%</span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <label className="block font-bold text-stone-900 mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              <span>Maximum Hall Images Allowed</span>
            </label>
            <p className="text-stone-500 text-[11px] mb-2">
              Maximum number of photos venue managers can upload per listing (minimum 2 mandatory, max 20).
            </p>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number"
                min="2"
                max="20"
                value={maxHallImages}
                onChange={(e) => setMaxHallImages(e.target.value)}
                disabled={loading || saving}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 disabled:opacity-50"
              />
              <span className="font-bold text-stone-500">Photos</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            disabled={loading || saving}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Platform Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

