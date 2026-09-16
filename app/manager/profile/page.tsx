'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Shield, Phone, MapPin, FileCheck, AlertCircle, Edit3, Save, X, CheckCircle2, Loader2 } from 'lucide-react';

export default function ManagerProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTaxId, setEditTaxId] = useState('');
  const [editRegistrationNumber, setEditRegistrationNumber] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.managerProfile) {
          const p = data.user.managerProfile;
          setEditBusinessName(p.businessName || '');
          setEditPhone(p.phone || data.user.phone || '');
          setEditCity(p.city || 'Bangalore');
          setEditAddress(p.address || '');
          setEditTaxId(p.taxId || '');
          setEditRegistrationNumber(p.businessRegistrationNumber || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/manager/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: editBusinessName,
          phone: editPhone,
          city: editCity,
          address: editAddress,
          taxId: editTaxId,
          businessRegistrationNumber: editRegistrationNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update business profile');
      }

      setSaveSuccess(true);
      setIsEditing(false);
      await loadProfile();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-stone-400">Loading manager profile...</div>;
  }

  const profile = user?.managerProfile;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-stone-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Manager & Business Profile</h1>
          <p className="text-xs text-stone-500">Business registration, tax IDs, and marketplace verification credentials</p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-amber-200 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">Business profile updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleUpdate} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-extrabold text-stone-900 text-sm">Edit Business Profile Details</h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Company / Venue Entity Name *</label>
              <input
                type="text"
                required
                value={editBusinessName}
                onChange={(e) => setEditBusinessName(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Contact Phone * (10 Digits)</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Operating City</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">GST / Tax ID</label>
                <input
                  type="text"
                  value={editTaxId}
                  onChange={(e) => setEditTaxId(e.target.value)}
                  placeholder="29AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Registration / CIN</label>
                <input
                  type="text"
                  value={editRegistrationNumber}
                  onChange={(e) => setEditRegistrationNumber(e.target.value)}
                  placeholder="U72900KA2020PTC123456"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Registered Office Address</label>
              <textarea
                rows={2}
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Full registered business address"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6 text-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-stone-900">{profile?.businessName || 'Business Name'}</h2>
                <p className="text-stone-500">{user?.email}</p>
              </div>
            </div>

            <span
              className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                profile?.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : profile?.verificationStatus === 'PENDING'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {profile?.verificationStatus || 'PENDING'}
            </span>
          </div>

          {profile?.verificationStatus === 'PENDING' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Verification Under Review</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                Platform operations administrators are reviewing your submitted tax ID and incorporation documents. You will receive an automated notification once approved.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-stone-700">
            <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Contact Phone</span>
              <span className="font-semibold text-stone-900">{profile?.phone || user?.phone || 'Not Provided'}</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Operating City</span>
              <span className="font-semibold text-stone-900">{profile?.city || 'Bangalore'}</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">GST / Tax Identification</span>
              <span className="font-semibold text-stone-900 font-mono">{profile?.taxId || 'Pending Submission'}</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Registration / CIN</span>
              <span className="font-semibold text-stone-900 font-mono">{profile?.businessRegistrationNumber || 'N/A'}</span>
            </div>
          </div>

          {profile?.address && (
            <div className="p-3.5 bg-stone-50 rounded-xl space-y-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Registered Office Address</span>
              <span className="text-stone-800 leading-relaxed">{profile.address}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

