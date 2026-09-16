'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  User,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import {
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
} from '@/lib/validation';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') === 'MANAGER' ? 'MANAGER' : 'CUSTOMER';

  const [role, setRole] = useState<'CUSTOMER' | 'MANAGER'>(defaultRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Manager specific fields
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [address, setAddress] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [taxId, setTaxId] = useState('');

  // Load active cities for manager signup
  useEffect(() => {
    async function loadCities() {
      try {
        const res = await fetch('/api/meta');
        if (res.ok) {
          const data = await res.json();
          if (data.cities && data.cities.length > 0) {
            setAvailableCities(data.cities);
            setCity(data.cities[0].name);
          }
        }
      } catch (e) {
        console.error('Failed to load cities for registration:', e);
      }
    }
    loadCities();
  }, []);

  // OTP Verification state
  const [step, setStep] = useState<'REGISTER' | 'OTP'>('REGISTER');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cooldown countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const passwordValidation = validatePasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // 1. Frontend validation checks
    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (phone && !isValidPhone(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!passwordValidation.isValid) {
      setError(`Password requirement: ${passwordValidation.feedback.join(', ')}`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password confirmation.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
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

      if (data.requireOtp) {
        setStep('OTP');
        setDevOtp(data.devOtpCode || null);
        setResendCooldown(60);
        setSuccessMsg(data.message || 'Verification code sent to your email.');
      } else {
        if (role === 'MANAGER') {
          router.push('/manager');
        } else {
          router.push('/search');
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otpCode || otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpCode.trim(),
          purpose: 'REGISTRATION',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        throw new Error(data.error || 'Verification failed');
      }

      setSuccessMsg('Account verified successfully! Redirecting...');
      setTimeout(() => {
        router.push('/search');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          purpose: 'REGISTRATION',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setDevOtp(data.devOtpCode || null);
      setResendCooldown(60);
      setSuccessMsg('A fresh verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white border border-amber-100 rounded-2xl shadow-xl p-8 space-y-6">
        {step === 'REGISTER' ? (
          <>
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
                List a Venue
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="font-medium">{error}</div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aditi Singhania"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aditi@example.com"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Phone Number {role === 'MANAGER' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-stone-400">10 digits, starts with 6-9</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                {/* Password Strength Checklist */}
                {password.length > 0 && (
                  <div className="mt-2 p-2.5 bg-stone-50 border border-stone-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 mb-1">
                      <span>Password Strength:</span>
                      <span
                        className={
                          passwordValidation.score <= 2
                            ? 'text-rose-600 font-bold'
                            : passwordValidation.score === 3
                            ? 'text-amber-600 font-bold'
                            : 'text-emerald-600 font-bold'
                        }
                      >
                        {passwordValidation.score <= 2
                          ? 'Weak'
                          : passwordValidation.score === 3
                          ? 'Moderate'
                          : 'Strong'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-500">
                      <div className="flex items-center gap-1">
                        {password.length >= 8 ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-rose-400" />
                        )}
                        <span>8+ Characters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/[A-Z]/.test(password) ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-rose-400" />
                        )}
                        <span>Uppercase (A-Z)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/[0-9]/.test(password) ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-rose-400" />
                        )}
                        <span>Number (0-9)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/[^A-Za-z0-9]/.test(password) ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-rose-400" />
                        )}
                        <span>Special Char (!@#)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-stone-200 focus:ring-amber-500'
                  }`}
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Manager Specific Fields */}
              {role === 'MANAGER' && (
                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Venue Business Details
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Company / Venue Entity Name *</label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Royal Palace Hospitality Pvt Ltd"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">Operating City *</label>
                      {availableCities.length > 0 ? (
                        <select
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          {availableCities.map((c: any) => (
                            <option key={c.id || c.name} value={c.name}>
                              {c.name} ({c.state})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Bangalore"
                          className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">GST / Tax ID</label>
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="29AAAAA0000A1Z5"
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Business Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Registered office address"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-amber-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : role === 'CUSTOMER' ? 'Register & Verify Email' : 'Register Venue Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          /* OTP Verification Step */
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-amber-50 rounded-2xl text-amber-700 mb-1">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Verify Your Email</h1>
              <p className="text-xs text-stone-500">
                We sent a 6-digit verification code to <span className="font-bold text-stone-800">{email}</span>
              </p>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {devOtp && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <span className="font-medium text-[11px]">Demo OTP: <strong className="font-mono text-xs">{devOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpCode(devOtp)}
                  className="text-[10px] font-bold uppercase text-brand-700 hover:underline"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 text-center">
                  Enter 6-Digit Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 text-center tracking-[0.6em] font-mono text-2xl font-bold bg-stone-50 border-2 border-amber-200 focus:border-brand-600 rounded-xl focus:outline-none shadow-inner"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="mt-1 text-center text-[11px] text-amber-700 font-medium">
                    {remainingAttempts} attempt(s) remaining
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-amber-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className="flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-900 disabled:text-stone-400"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('REGISTER');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-medium text-stone-500 hover:text-stone-800"
              >
                Change Email
              </button>
            </div>
          </div>
        )}

        <div className="text-center pt-2 text-xs text-stone-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-brand-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-stone-400">Loading registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
