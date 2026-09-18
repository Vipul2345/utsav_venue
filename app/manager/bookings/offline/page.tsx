'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Calendar,
  Clock,
  Users,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function ManagerOfflineBookingPage() {
  const router = useRouter();

  const [halls, setHalls] = useState<any[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<string>('');
  const [loadingHalls, setLoadingHalls] = useState(true);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [occasionId, setOccasionId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('23:00');
  const [guestCount, setGuestCount] = useState(250);
  const [totalAmount, setTotalAmount] = useState(75000);
  const [notes, setNotes] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<any>(null);

  useEffect(() => {
    async function loadHalls() {
      setLoadingHalls(true);
      try {
        // Try manager halls first
        const res = await fetch('/api/manager/halls');
        if (res.ok) {
          const data = await res.json();
          if (data.halls && data.halls.length > 0) {
            setHalls(data.halls);
            setSelectedHallId(data.halls[0].id);
            if (data.halls[0].occasions?.length > 0) {
              setOccasionId(data.halls[0].occasions[0].occasion?.id || data.halls[0].occasions[0].occasionId || '');
            }
            return;
          }
        }

        // Fallback for Admin or all halls
        const publicRes = await fetch('/api/halls');
        if (publicRes.ok) {
          const pData = await publicRes.json();
          const list = pData.halls || [];
          setHalls(list);
          if (list.length > 0) {
            setSelectedHallId(list[0].id);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load venues');
      } finally {
        setLoadingHalls(false);
      }
    }
    loadHalls();
  }, []);

  const selectedHall = halls.find((h) => h.id === selectedHallId);

  // Update default occasions when selected hall changes
  const handleHallChange = (id: string) => {
    setSelectedHallId(id);
    const h = halls.find((item) => item.id === id);
    if (h?.occasions?.length > 0) {
      setOccasionId(h.occasions[0].occasion?.id || h.occasions[0].occasionId || '');
    } else {
      setOccasionId('');
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val > endDate) {
      setEndDate(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHallId || !customerName.trim() || !customerPhone.trim() || !startDate) {
      setError('Please fill in all mandatory booking fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/manager/bookings/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallId: selectedHallId,
          occasionId: occasionId || undefined,
          startDate,
          endDate: endDate || startDate,
          eventDate: startDate,
          startTime,
          endTime,
          guestCount: Number(guestCount),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          totalAmount: Number(totalAmount) || 0,
          notes: notes.trim() || 'Direct walk-in offline reservation',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm offline booking');
      }

      setSuccessBooking(data.booking);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingHalls) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-xs font-bold text-stone-500">
        Loading venue details...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/manager/bookings"
          className="flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Bookings</span>
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-black tracking-tight text-stone-900">Record Offline Booking</span>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-100 text-purple-900 px-2 py-0.5 rounded">
              Staff Portal
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Log walk-in, phone, or contract reservations. Slots are instantly locked to prevent online double-bookings.
          </p>
        </div>

        {/* Concurrency Row-Lock Protection Callout */}
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start gap-3 text-xs text-purple-900">
          <Lock className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed text-[11px]">
            <p className="font-bold text-purple-950">Authoritative Concurrency Protection</p>
            <p className="text-purple-800">
              Submitting an offline reservation performs an atomic pessimistic row-level lock (<code className="bg-purple-100 px-1 py-0.5 rounded font-mono">SELECT FOR UPDATE</code>) on the venue, verifying zero conflicts with active online holds and blackout schedules. The dates are instantly marked unavailable for online search.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Booking Conflict / Error</p>
              <p className="text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successBooking ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-emerald-950">Offline Booking Confirmed & Locked!</h3>
              <p className="text-xs text-emerald-800">
                Booking Reference: <strong className="font-mono text-emerald-950">{successBooking.bookingNumber}</strong>
              </p>
              <p className="text-[11px] text-emerald-700">
                Calendar dates {successBooking.startDate || successBooking.eventDate} to {successBooking.endDate || successBooking.eventDate} are now protected against online double-booking.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessBooking(null);
                  setCustomerName('');
                  setCustomerPhone('');
                  setNotes('');
                }}
                className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-xs rounded-xl transition"
              >
                Record Another Booking
              </button>
              <Link
                href="/manager/bookings"
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition shadow"
              >
                View Bookings List
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Venue Selector */}
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wide text-[11px] mb-1">
                Venue *
              </label>
              <select
                value={selectedHallId}
                onChange={(e) => handleHallChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500"
              >
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city?.name || 'City'})
                  </option>
                ))}
              </select>
            </div>

            {/* Client Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wide text-[11px] mb-1">
                  Client Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Smt. Sunita Verma"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wide text-[11px] mb-1">
                  Client Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98450 12345"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Occasion & Guest Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wide text-[11px] mb-1">
                  Occasion Type
                </label>
                <select
                  value={occasionId}
                  onChange={(e) => setOccasionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">General Celebration / Event</option>
                  {selectedHall?.occasions?.map((ho: any) => {
                    const occ = ho.occasion || ho;
                    return (
                      <option key={occ.id} value={occ.id}>
                        {occ.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wide text-[11px] mb-1">
                  Estimated Guests *
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    required
                    min={10}
                    max={selectedHall?.maxCapacity || 5000}
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value || '0', 10))}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Dates & Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wide text-[11px] mb-1">
                  Event Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wide text-[11px] mb-1">
                  Event End Date *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wide text-[11px] mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wide text-[11px] mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Total Agreed Amount */}
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wide text-[11px] mb-1">
                Agreed Contract Amount (₹) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseInt(e.target.value || '0', 10))}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wide text-[11px] mb-1">
                Internal Management Notes / Payment Record
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. ₹25,000 cash advance received. Remainder due on event date. Special stage decoration requested."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
              <Link
                href="/manager/bookings"
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50 cursor-pointer min-h-[42px]"
              >
                <Lock className="w-4 h-4" />
                <span>{submitting ? 'Acquiring Concurrency Lock...' : 'Lock Slot & Confirm Booking'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
