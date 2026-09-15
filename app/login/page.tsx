'use client';

export const dynamic = 'force-dynamic';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user.role === 'ADMIN') {
        router.push(redirectUrl === '/' ? '/admin' : redirectUrl);
      } else if (data.user.role === 'MANAGER') {
        router.push(redirectUrl === '/' ? '/manager' : redirectUrl);
      } else {
        router.push(redirectUrl);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, role: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-amber-100 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-50 rounded-2xl text-amber-700 mb-1">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Welcome Back</h1>
          <p className="text-xs text-stone-500">Sign in to your customer, manager, or admin account</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Quick fill buttons for testing */}
        <div className="pt-4 border-t border-stone-100">
          <p className="text-[11px] font-bold text-stone-500 mb-2 text-center uppercase tracking-wider">
            Quick Fill Demo Accounts:
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickFill('superadmin@platform.com', 'Super Admin')}
              className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg font-medium text-left truncate"
            >
              👑 Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('verifyadmin@platform.com', 'Verify Admin')}
              className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg font-medium text-left truncate"
            >
              🛡️ Verify Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('manager.sharma@royalvenues.com', 'Manager')}
              className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-medium text-left truncate"
            >
              🏢 Hall Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('rahul.verma@example.com', 'Customer')}
              className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg font-medium text-left truncate"
            >
              👤 Customer
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-stone-500">
          Don't have an account yet?{' '}
          <Link href="/register" className="font-bold text-amber-700 hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-stone-400">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
