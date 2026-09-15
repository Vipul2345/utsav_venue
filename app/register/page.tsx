'use client';

export const dynamic = 'force-dynamic';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, Sparkles, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') === 'MANAGER' ? 'MANAGER' : 'CUSTOMER';

  const [role, setRole] = useState<'CUSTOMER' | 'MANAGER'>(defaultRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Manager specific fields
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [address, setAddress] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [taxId, setTaxId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          fullName,
          email,
          phone,
          password,
          businessName: role === 'MANAGER' ? businessName : undefined,
          city: role === 'MANAGER' ? city : undefined,
          address: role === 'MANAGER' ? address : undefined,
          registrationNumber: role === 'MANAGER' ? registrationNumber : undefined,
          taxId: role === 'MANAGER' ? taxId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (role === 'MANAGER') {
        router.push('/manager');
      } else {
        router.push('/search');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white border border-amber-100 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-50 rounded-2xl text-amber-700 mb-1">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Create an Account</h1>
          <p className="text-xs text-stone-500">Join the premier banquet & event venue marketplace</p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              role === 'CUSTOMER'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4 text-brand-600" />
            Book a Venue
          </button>
          <button
            type="button"
            onClick={() => setRole('MANAGER')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              role === 'MANAGER'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-600" />
            List as Venue Manager
          </button>
        </div>

        {role === 'MANAGER' && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Manager listings undergo administrative verification before publishing to guarantee venue quality and guest safety.
            </span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ramesh Gupta"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ramesh@example.com"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Password (min 8 characters) *</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          {/* Hall Manager Business Fields */}
          {role === 'MANAGER' && (
            <div className="space-y-3 pt-3 border-t border-stone-200">
              <p className="font-bold text-amber-900 text-xs uppercase tracking-wide">
                Business & Hospitality Details
              </p>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Registered Business / Venue Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Royal Heritage Banquets Pvt Ltd"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Primary Operating City *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  >
                    <option value="Bangalore">Bangalore</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">GST / Tax ID</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="29AABCR1234F1Z5"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Business Registration / CIN Number</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="U55101KA2024PTC112345"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Account...' : role === 'MANAGER' ? 'Register as Hall Manager' : 'Create Customer Account'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center text-xs text-stone-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-amber-700 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-stone-400">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
