'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Shield, Phone, MapPin, FileCheck, AlertCircle } from 'lucide-react';

export default function ManagerProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-stone-400">Loading manager profile...</div>;
  }

  const profile = user?.managerProfile;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Manager & Business Profile</h1>
        <p className="text-xs text-stone-500">Business registration, tax IDs, and marketplace verification credentials</p>
      </div>

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
    </div>
  );
}
