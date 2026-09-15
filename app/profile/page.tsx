'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, Building2, Shield, Calendar, Award } from 'lucide-react';

export default function ProfilePage() {
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
    return <div className="py-20 text-center text-xs font-bold text-stone-400">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-3">
        <h2 className="text-lg font-bold text-stone-900">Please Sign In</h2>
        <p className="text-xs text-stone-500">Sign in to view your user profile and settings.</p>
        <Link href="/login" className="inline-block px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Account Profile</h1>
        <p className="text-xs text-stone-500">Manage your credentials, role privileges, and contact details</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center font-black text-2xl shadow">
            {user.fullName[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-stone-900">{user.fullName}</h2>
            <p className="text-xs text-stone-500">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                {user.role}
              </span>
              {user.adminProfile && (
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                  {user.adminProfile.adminRole}
                </span>
              )}
              {user.managerProfile && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  {user.managerProfile.verificationStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100 text-xs">
          <div className="p-3.5 bg-stone-50 rounded-2xl space-y-1">
            <span className="text-[10px] text-stone-400 font-bold uppercase">Phone Number</span>
            <p className="font-semibold text-stone-800">{user.phone || '+91 Not Provided'}</p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl space-y-1">
            <span className="text-[10px] text-stone-400 font-bold uppercase">Account Status</span>
            <p className="font-semibold text-emerald-700">Active & Verified</p>
          </div>
        </div>

        {/* Manager Details */}
        {user.managerProfile && (
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2 text-xs">
            <h3 className="font-bold text-amber-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-700" />
              <span>Hospitality Business Profile</span>
            </h3>
            <p className="text-stone-700">
              <strong>Business:</strong> {user.managerProfile.businessName}
            </p>
            <p className="text-stone-700">
              <strong>Verification Status:</strong> {user.managerProfile.verificationStatus}
            </p>
            {user.managerProfile.taxId && (
              <p className="text-stone-700">
                <strong>GST / Tax ID:</strong> {user.managerProfile.taxId}
              </p>
            )}
          </div>
        )}

        {/* Portal Access Links */}
        <div className="pt-2 flex flex-wrap gap-2">
          {user.role === 'MANAGER' && (
            <Link
              href="/manager"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Open Manager Portal →
            </Link>
          )}

          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Open Admin Console →
            </Link>
          )}

          <Link
            href="/bookings"
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition"
          >
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
