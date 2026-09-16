'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Star,
  Users,
  MapPin,
  AlertCircle,
  Eye,
  Shield,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useModalDismiss } from '@/lib/hooks/useModalDismiss';

export default function AdminHallsPage() {
  const [halls, setHalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Preview & Action Modal
  const [selectedHall, setSelectedHall] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const hallModalRef = useRef<HTMLDivElement>(null);

  useModalDismiss(
    hallModalRef,
    () => {
      setSelectedHall(null);
      setShowRejectBox(false);
    },
    !!selectedHall
  );

  const fetchHalls = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter === 'all' ? '/api/admin/halls' : `/api/admin/halls?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch halls');
      setHalls(data.halls || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalls();
  }, [statusFilter]);

  const handleAction = async (hallId: string, action: string, reason?: string, isFeaturedVal?: boolean) => {
    setActionInProgress(true);
    try {
      const res = await fetch('/api/admin/halls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallId,
          action,
          rejectionReason: reason,
          isFeatured: isFeaturedVal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setSelectedHall(null);
      setShowRejectBox(false);
      setRejectReason('');
      fetchHalls();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Banquet Hall Moderation Queue</h1>
          <p className="text-xs text-stone-500">Review submitted listings, verify photos and capacity, and approve for marketplace publishing</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-bold text-stone-700">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-bold shadow-sm"
          >
            <option value="all">All Listings</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved & Live</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading hall submissions...</div>
      ) : halls.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
          <Building2 className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-bold text-sm text-stone-800">No venue listings in this status.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {halls.map((hall) => (
            <div
              key={hall.id}
              className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-stone-100">
                  <img
                    src={hall.media?.[0]?.url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80'}
                    alt={hall.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow ${
                        hall.status === 'APPROVED'
                          ? 'bg-emerald-500 text-white'
                          : hall.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-500 text-stone-900'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {hall.status}
                    </span>
                    {hall.isFeatured && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-600 text-white shadow">
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-purple-700">
                      {hall.city?.name}, {hall.locality?.name}
                    </span>
                    <h3 className="text-base font-extrabold text-stone-900 mt-0.5">{hall.name}</h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Submitted by: <strong>{hall.manager?.businessName}</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-100">
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Capacity</span>
                      <span className="font-semibold text-stone-800">{hall.minCapacity} – {hall.maxCapacity} Guests</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Base Rental</span>
                      <span className="font-semibold text-stone-800">
                        ₹{(hall.pricingRule?.baseRentalPrice || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {hall.rejectionReason && (
                    <div className="p-2.5 bg-rose-50 rounded-xl text-[11px] text-rose-800">
                      <strong>Rejection Note:</strong> {hall.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedHall(hall)}
                  className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {hall.status === 'PENDING_APPROVAL' && (
                    <>
                      <button
                        onClick={() => handleAction(hall.id, 'APPROVE')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedHall(hall);
                          setShowRejectBox(true);
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {hall.status === 'APPROVED' && (
                    <button
                      onClick={() => handleAction(hall.id, 'TOGGLE_FEATURED', undefined, !hall.isFeatured)}
                      className={`px-3 py-1.5 font-bold text-xs rounded-xl transition ${
                        hall.isFeatured
                          ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {hall.isFeatured ? '★ Featured' : '☆ Feature'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hall Inspection / Rejection Modal */}
      {selectedHall && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => {
            setSelectedHall(null);
            setShowRejectBox(false);
          }}
        >
          <div
            ref={hallModalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-purple-700">{selectedHall.city?.name}</span>
                <h2 className="text-xl font-extrabold text-stone-900">{selectedHall.name}</h2>
                <p className="text-xs text-stone-500">{selectedHall.address}</p>
              </div>

              <button
                onClick={() => {
                  setSelectedHall(null);
                  setShowRejectBox(false);
                }}
                className="text-stone-400 hover:text-stone-800 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-stone-800 mb-1">Description</h4>
                <p className="text-stone-600 leading-relaxed whitespace-pre-line">{selectedHall.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-700 bg-stone-50 p-3.5 rounded-2xl">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Capacity</span>
                  <span className="font-bold">{selectedHall.minCapacity} – {selectedHall.maxCapacity}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Base Rental</span>
                  <span className="font-bold">₹{(selectedHall.pricingRule?.baseRentalPrice || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Veg Plate</span>
                  <span className="font-bold">₹{selectedHall.pricingRule?.perPlateVegPrice || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Non-Veg Plate</span>
                  <span className="font-bold">₹{selectedHall.pricingRule?.perPlateNonVegPrice || 0}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-stone-800 mb-1.5">Proposed Occasions</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedHall.occasions?.map((ho: any) => (
                    <span
                      key={ho.occasion?.id || ho.id}
                      className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-900 rounded-lg font-semibold text-[11px]"
                    >
                      {ho.occasion?.name} ({ho.status})
                    </span>
                  ))}
                </div>
              </div>

              {/* Rejection input if triggered */}
              {showRejectBox && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <label className="block font-bold text-rose-900">Mandatory Rejection Reason *</label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Please provide high-resolution photos and upload clear fire safety NOC certificate..."
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(false)}
                      className="px-3 py-1.5 bg-stone-100 text-stone-700 font-bold rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!rejectReason.trim() || actionInProgress}
                      onClick={() => handleAction(selectedHall.id, 'REJECT', rejectReason)}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!showRejectBox && (
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedHall(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectBox(true)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs"
                  >
                    Reject with Reason
                  </button>

                  <button
                    type="button"
                    disabled={actionInProgress}
                    onClick={() => handleAction(selectedHall.id, 'APPROVE')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Approve Listing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
