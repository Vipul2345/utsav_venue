'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Save, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ManagerEditHallPage() {
  const params = useParams();
  const router = useRouter();
  const hallId = params.id as string;

  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minCapacity, setMinCapacity] = useState('100');
  const [maxCapacity, setMaxCapacity] = useState('500');
  const [baseRentalPrice, setBaseRentalPrice] = useState('50000');
  const [alcoholAllowed, setAlcoholAllowed] = useState(false);
  const [outsideCateringAllowed, setOutsideCateringAllowed] = useState(false);
  const [outsideDecorAllowed, setOutsideDecorAllowed] = useState(false);
  const [cancellationDeadlineHours, setCancellationDeadlineHours] = useState('72');
  const [refundPercentage, setRefundPercentage] = useState('80');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/manager/halls/${hallId}`);
        if (!res.ok) throw new Error('Unauthorized or venue not found');
        const data = await res.json();
        const h = data.hall;
        setHall(h);
        setName(h.name);
        setDescription(h.description);
        setMinCapacity(h.minCapacity.toString());
        setMaxCapacity(h.maxCapacity.toString());
        setBaseRentalPrice((h.pricingRule?.baseRentalPrice || 50000).toString());
        setAlcoholAllowed(h.alcoholAllowed);
        setOutsideCateringAllowed(h.outsideCateringAllowed);
        setOutsideDecorAllowed(h.outsideDecorAllowed);
        setCancellationDeadlineHours((h.cancellationDeadlineHours || 72).toString());
        setRefundPercentage((h.refundPercentage || 80).toString());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hallId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/manager/halls/${hallId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          minCapacity,
          maxCapacity,
          baseRentalPrice,
          alcoholAllowed,
          outsideCateringAllowed,
          outsideDecorAllowed,
          cancellationDeadlineHours,
          refundPercentage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update hall');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-stone-400">Loading hall configuration...</div>;
  }

  if (error && !hall) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900">Access Restricted</h2>
        <p className="text-xs text-stone-500">{error}</p>
        <Link href="/manager/halls" className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl inline-block">
          Back to My Halls
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/manager/halls" className="p-2 text-stone-400 hover:text-stone-800 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-stone-900">Edit {hall.name}</h1>
            <p className="text-xs text-stone-500">Update capacity, pricing, and guest policies</p>
          </div>
        </div>

        <span
          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
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

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Hall configuration saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 text-xs">
        <div>
          <label className="block font-semibold text-stone-700 mb-1">Hall Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-stone-700 mb-1">Description</label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Min Capacity</label>
            <input
              type="number"
              required
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Max Capacity</label>
            <input
              type="number"
              required
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-stone-700 mb-1">Base Rental Price (₹)</label>
          <input
            type="number"
            required
            value={baseRentalPrice}
            onChange={(e) => setBaseRentalPrice(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Cancellation Notice (Hours)</label>
            <input
              type="number"
              value={cancellationDeadlineHours}
              onChange={(e) => setCancellationDeadlineHours(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Refund Percentage (%)</label>
            <input
              type="number"
              value={refundPercentage}
              onChange={(e) => setRefundPercentage(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={alcoholAllowed}
              onChange={(e) => setAlcoholAllowed(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Alcohol Permitted (with event license)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={outsideCateringAllowed}
              onChange={(e) => setOutsideCateringAllowed(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Outside Catering Allowed</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={outsideDecorAllowed}
              onChange={(e) => setOutsideDecorAllowed(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Outside Decor Allowed</span>
          </label>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
