'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle2, XCircle, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { useModalDismiss } from '@/lib/hooks/useModalDismiss';

export default function AdminOccasionsPage() {
  const [hallOccasions, setHallOccasions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const rejectModalRef = useRef<HTMLDivElement>(null);

  useModalDismiss(rejectModalRef, () => setRejectingId(null), !!rejectingId);

  const fetchOccasions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/occasions');
      const data = await res.json();
      if (res.ok) {
        setHallOccasions(data.hallOccasions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOccasions();
  }, []);

  const handleAction = async (hallOccasionId: string, action: 'APPROVE' | 'REJECT') => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/occasions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallOccasionId,
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update occasion status');
      }

      setRejectingId(null);
      setRejectionReason('');
      fetchOccasions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = hallOccasions.filter((ho) => {
    if (statusFilter !== 'all' && ho.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Independent Occasion Approvals</h1>
          <p className="text-xs text-stone-500">
            Per-hall occasion authorization: reject celebrations not suited for venue capacity or zoning
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-bold text-stone-700">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-bold shadow-sm"
          >
            <option value="all">All Occasions</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved & Bookable</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading occasion mappings...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
          <Sparkles className="w-12 h-12 text-stone-300 mx-auto" />
          <p className="text-xs text-stone-500 font-bold">No occasions match the selected filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Banquet Hall</th>
                  <th className="p-4">Proposed Occasion</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4">Rejection Reason / Notes</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((ho) => (
                  <tr key={ho.id} className="hover:bg-stone-50/50 transition">
                    <td className="p-4">
                      <p className="font-extrabold text-stone-900">{ho.hall.name}</p>
                      <p className="text-[10px] text-stone-400 uppercase">Hall Status: {ho.hall.status}</p>
                    </td>
                    <td className="p-4 font-bold text-purple-900 flex items-center gap-1.5 pt-5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{ho.occasion.name}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          ho.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ho.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ho.status}
                      </span>
                    </td>
                    <td className="p-4 text-stone-600 max-w-xs truncate">
                      {ho.rejectionReason || '—'}
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      {ho.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleAction(ho.id, 'APPROVE')}
                          disabled={submitting}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm"
                        >
                          Approve
                        </button>
                      )}

                      {ho.status !== 'REJECTED' && (
                        <button
                          onClick={() => {
                            setRejectingId(ho.id);
                            setRejectionReason('Not suited for venue capacity or noise zoning rules');
                          }}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Occasion Rejection Dialog */}
      {rejectingId && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setRejectingId(null)}
        >
          <div
            ref={rejectModalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <h3 className="text-base font-bold text-stone-900">Reject Proposed Occasion</h3>
            <p className="text-xs text-stone-600">
              This occasion will be immediately blocked and hidden from customer discovery for this hall.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Rejection Reason</label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Minimum capacity (200) not appropriate for small birthdays"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || !rejectionReason.trim()}
                  onClick={() => handleAction(rejectingId, 'REJECT')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow"
                >
                  {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
