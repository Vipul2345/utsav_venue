'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, CheckCircle2, XCircle, AlertCircle, RefreshCw, Search } from 'lucide-react';

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action modal
  const [modalManager, setModalManager] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'VERIFY' | 'REJECT' | 'SUSPEND'>('VERIFY');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchManagers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/managers');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load managers');
      setManagers(data.managers || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalManager) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerId: modalManager.id,
          action: actionType,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setModalManager(null);
      setNotes('');
      fetchManagers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Manager Verification Queue</h1>
          <p className="text-xs text-stone-500">Review business licenses, tax registrations, and authorize venue managers</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading manager applications...</div>
      ) : managers.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8">
          <UserCheck className="w-12 h-12 text-stone-300 mx-auto mb-2" />
          <p className="text-xs text-stone-500 font-bold">No manager applications found.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Business & Hospitality Name</th>
                  <th className="p-4">Manager Contact</th>
                  <th className="p-4">Tax ID / GST</th>
                  <th className="p-4">Registration #</th>
                  <th className="p-4">Halls</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {managers.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50/50 transition">
                    <td className="p-4">
                      <p className="font-extrabold text-stone-900">{m.businessName}</p>
                      <p className="text-[11px] text-stone-500">{m.city}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-stone-900">{m.user.fullName}</p>
                      <p className="text-[11px] text-stone-500">{m.user.email} | {m.phone}</p>
                    </td>
                    <td className="p-4 font-mono font-semibold text-stone-700">{m.taxId || 'N/A'}</td>
                    <td className="p-4 font-mono text-stone-600">{m.businessRegistrationNumber || 'N/A'}</td>
                    <td className="p-4 font-bold text-stone-800">{m._count?.halls || 0} Venues</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          m.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.verificationStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.verificationStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      {m.verificationStatus !== 'VERIFIED' ? (
                        <button
                          onClick={() => {
                            setModalManager(m);
                            setActionType('VERIFY');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
                        >
                          Verify
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setModalManager(m);
                            setActionType('SUSPEND');
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition"
                        >
                          Suspend
                        </button>
                      )}

                      {m.verificationStatus === 'PENDING' && (
                        <button
                          onClick={() => {
                            setModalManager(m);
                            setActionType('REJECT');
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition"
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

      {/* Action Confirmation Modal */}
      {modalManager && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-stone-900">
              {actionType === 'VERIFY'
                ? `Verify ${modalManager.businessName}?`
                : `${actionType} ${modalManager.businessName}?`}
            </h3>
            <p className="text-xs text-stone-600">
              {actionType === 'VERIFY'
                ? 'Verifying allows this manager to create and publish banquet hall listings on the marketplace.'
                : 'Please state the reason for this action. The manager will be notified.'}
            </p>

            <form onSubmit={handleAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Administrative Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    actionType === 'VERIFY'
                      ? 'e.g. Valid GST and CIN verified via government registry.'
                      : 'e.g. Please upload clear incorporation certificate.'
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalManager(null)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-white font-bold rounded-xl shadow ${
                    actionType === 'VERIFY' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Updating...' : `Confirm ${actionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
