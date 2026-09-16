'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Users,
  Building2,
  Phone,
  Lock,
  Trash2,
} from 'lucide-react';
import { useModalDismiss } from '@/lib/hooks/useModalDismiss';

export default function ManagerCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [halls, setHalls] = useState<any[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const extModalRef = useRef<HTMLDivElement>(null);
  const blockModalRef = useRef<HTMLDivElement>(null);

  useModalDismiss(extModalRef, () => setShowExternalModal(false), showExternalModal);
  useModalDismiss(blockModalRef, () => setShowBlockModal(false), showBlockModal);

  // External Booking Form State
  const [extHallId, setExtHallId] = useState('');
  const [extDate, setExtDate] = useState(new Date().toISOString().split('T')[0]);
  const [extStartTime, setExtStartTime] = useState('16:00');
  const [extEndTime, setExtEndTime] = useState('23:00');
  const [extGuestCount, setExtGuestCount] = useState('250');
  const [extCustomerName, setExtCustomerName] = useState('');
  const [extCustomerPhone, setExtCustomerPhone] = useState('');
  const [extAmount, setExtAmount] = useState('95000');
  const [submittingExt, setSubmittingExt] = useState(false);
  const [extError, setExtError] = useState<string | null>(null);

  // Blackout Block Form State
  const [blockHallId, setBlockHallId] = useState('');
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockReason, setBlockReason] = useState('Facility Maintenance & Painting');
  const [submittingBlock, setSubmittingBlock] = useState(false);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const url =
        selectedHallId === 'all'
          ? '/api/manager/calendar'
          : `/api/manager/calendar?hallId=${selectedHallId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setHalls(data.halls || []);
        if (data.halls?.length > 0 && !extHallId) {
          setExtHallId(data.halls[0].id);
          setBlockHallId(data.halls[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [selectedHallId]);

  const handleCreateExternalBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingExt(true);
    setExtError(null);

    try {
      const res = await fetch('/api/manager/bookings/external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallId: extHallId,
          eventDate: extDate,
          startTime: extStartTime,
          endTime: extEndTime,
          guestCount: extGuestCount,
          customerName: extCustomerName,
          customerPhone: extCustomerPhone,
          totalAmount: extAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create external booking');

      setShowExternalModal(false);
      setExtCustomerName('');
      setExtCustomerPhone('');
      fetchCalendar();
    } catch (err: any) {
      setExtError(err.message);
    } finally {
      setSubmittingExt(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBlock(true);

    try {
      const res = await fetch('/api/manager/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallId: blockHallId,
          startDate: blockDate,
          endDate: blockDate,
          reason: blockReason,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create blackout block');
      }

      setShowBlockModal(false);
      fetchCalendar();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to remove this maintenance block?')) return;
    try {
      await fetch(`/api/manager/blocks?id=${blockId}`, { method: 'DELETE' });
      fetchCalendar();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-amber-600" />
            <span>Venue Availability & Calendar</span>
          </h1>
          <p className="text-xs text-stone-500">
            Real-time interval occupancy, online reservations, offline phone bookings, and maintenance blackouts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExternalModal(true)}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Record Phone / External Booking</span>
          </button>

          <button
            onClick={() => setShowBlockModal(true)}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Lock className="w-4 h-4" />
            <span>+ Block Dates</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-700">Filter Venue:</span>
          <select
            value={selectedHallId}
            onChange={(e) => setSelectedHallId(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold"
          >
            <option value="all">All Managed Venues</option>
            {halls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Online Confirmed
          </span>
          <span className="flex items-center gap-1 text-purple-800">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> External / Phone Booking
          </span>
          <span className="flex items-center gap-1 text-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Active 10-Min Hold
          </span>
          <span className="flex items-center gap-1 text-stone-600">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-500" /> Maintenance Block
          </span>
        </div>
      </div>

      {/* Events Schedule List / Calendar Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading schedule...</div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
          <CalendarIcon className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-bold text-stone-800 text-sm">No scheduled events or blocks found.</h3>
          <p className="text-xs text-stone-400">All dates and intervals are currently open for customer bookings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className={`p-4 rounded-2xl border transition shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                ev.type === 'ONLINE_BOOKING'
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : ev.type === 'EXTERNAL_BOOKING'
                  ? 'bg-purple-50/40 border-purple-200'
                  : 'bg-stone-100/70 border-stone-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      ev.type === 'ONLINE_BOOKING'
                        ? 'bg-emerald-200 text-emerald-900'
                        : ev.type === 'EXTERNAL_BOOKING'
                        ? 'bg-purple-200 text-purple-900'
                        : 'bg-stone-300 text-stone-800'
                    }`}
                  >
                    {ev.type === 'ONLINE_BOOKING'
                      ? 'Online Verified'
                      : ev.type === 'EXTERNAL_BOOKING'
                      ? 'Offline / Phone'
                      : 'Maintenance Block'}
                  </span>

                  {ev.bookingNumber && (
                    <span className="font-mono text-[11px] font-bold text-stone-800">
                      {ev.bookingNumber}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-stone-900">{ev.title}</h3>

                {ev.clientPhone && (
                  <p className="text-stone-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>Client Contact: {ev.clientPhone}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-left sm:text-right space-y-0.5">
                  <p className="font-bold text-stone-900 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-700" />
                    <span>{ev.date}</span>
                  </p>
                  <p className="text-stone-600 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{ev.startTime} – {ev.endTime}</span>
                  </p>
                  {ev.guestCount && (
                    <p className="text-stone-500 text-[11px]">{ev.guestCount} Guests</p>
                  )}
                </div>

                {ev.type === 'MAINTENANCE_BLOCK' && (
                  <button
                    onClick={() => handleDeleteBlock(ev.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-white rounded-xl transition"
                    title="Remove block"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* External Booking Modal */}
      {showExternalModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowExternalModal(false)}
        >
          <div
            ref={extModalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div>
              <h3 className="text-base font-bold text-stone-900">Record Direct / Phone Booking</h3>
              <p className="text-xs text-stone-500">
                Locks the slot so online customers cannot double-book this time interval.
              </p>
            </div>

            {extError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {extError}
              </div>
            )}

            <form onSubmit={handleCreateExternalBooking} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Select Venue *</label>
                <select
                  value={extHallId}
                  onChange={(e) => setExtHallId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold"
                >
                  {halls.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={extDate}
                    onChange={(e) => setExtDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Expected Guests</label>
                  <input
                    type="number"
                    value={extGuestCount}
                    onChange={(e) => setExtGuestCount(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={extStartTime}
                    onChange={(e) => setExtStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={extEndTime}
                    onChange={(e) => setExtEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={extCustomerName}
                    onChange={(e) => setExtCustomerName(e.target.value)}
                    placeholder="Col. Verma"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Client Phone</label>
                  <input
                    type="tel"
                    value={extCustomerPhone}
                    onChange={(e) => setExtCustomerPhone(e.target.value)}
                    placeholder="+91 98450 11223"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Agreed Offline Amount (₹)</label>
                <input
                  type="number"
                  value={extAmount}
                  onChange={(e) => setExtAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExternalModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExt}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow"
                >
                  {submittingExt ? 'Locking Slot...' : 'Lock Slot for External Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowBlockModal(false)}
        >
          <div
            ref={blockModalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div>
              <h3 className="text-base font-bold text-stone-900">Block Dates for Maintenance</h3>
              <p className="text-xs text-stone-500">Prevent bookings during repairs or private reservations</p>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Venue *</label>
                <select
                  value={blockHallId}
                  onChange={(e) => setBlockHallId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold"
                >
                  {halls.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Blackout Date *</label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Reason for Blackout *</label>
                <input
                  type="text"
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. AC repair, chandelier cleaning, VIP private dinner"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBlock}
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white font-bold rounded-xl shadow"
                >
                  {submittingBlock ? 'Creating...' : 'Confirm Blackout Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
