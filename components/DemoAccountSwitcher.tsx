'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, Building2, User, RefreshCw, KeyRound } from 'lucide-react';
import { useModalDismiss } from '@/lib/hooks/useModalDismiss';

const DEMO_USERS = [
  {
    role: 'Super Admin',
    email: 'superadmin@platform.com',
    desc: 'All admin privileges',
    icon: ShieldCheck,
    color: 'bg-purple-600',
    redirect: '/admin',
  },
  {
    role: 'Verification Admin',
    email: 'verifyadmin@platform.com',
    desc: 'Review & approve managers & halls',
    icon: ShieldCheck,
    color: 'bg-indigo-600',
    redirect: '/admin/halls',
  },
  {
    role: 'Finance Admin',
    email: 'financeadmin@platform.com',
    desc: 'Payments & refunds ledger',
    icon: ShieldCheck,
    color: 'bg-emerald-600',
    redirect: '/admin/payments',
  },
  {
    role: 'Verified Manager',
    email: 'manager.sharma@royalvenues.com',
    desc: 'Royal Venues (Active halls & calendar)',
    icon: Building2,
    color: 'bg-amber-600',
    redirect: '/manager',
  },
  {
    role: 'Pending Manager',
    email: 'manager.new@emergingvenues.com',
    desc: 'Pending verification account',
    icon: Building2,
    color: 'bg-orange-600',
    redirect: '/manager',
  },
  {
    role: 'Customer (Rahul)',
    email: 'rahul.verma@example.com',
    desc: 'Past booking & review history',
    icon: User,
    color: 'bg-rose-600',
    redirect: '/bookings',
  },
];

export default function DemoAccountSwitcher({ currentUser }: { currentUser: any }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  useModalDismiss(switcherRef, () => setIsOpen(false), isOpen);

  const switchAccount = async (email: string, redirect: string) => {
    setLoading(email);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!' }),
      });
      if (res.ok) {
        setIsOpen(false);
        router.push(redirect);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="relative" ref={switcherRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Quick Demo Login"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full shadow-sm transition min-h-[36px]"
        title="Quickly test any role with one click"
      >
        <KeyRound className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span className="hidden sm:inline">Demo</span>
        <span className="hidden md:inline"> Login</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-900">Instant Role Switcher</p>
              <p className="text-[10px] text-gray-500">Test marketplace from any user role</p>
            </div>
            {currentUser && (
              <button
                onClick={handleLogout}
                className="text-[10px] font-medium text-rose-600 hover:text-rose-800 p-1"
              >
                Sign out
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-[60vh] sm:max-h-96 overflow-y-auto pr-1">
            {DEMO_USERS.map((u) => {
              const Icon = u.icon;
              const isCurrent = currentUser?.email === u.email;
              const isLoading = loading === u.email;

              return (
                <button
                  key={u.email}
                  disabled={!!loading || isCurrent}
                  onClick={() => switchAccount(u.email, u.redirect)}
                  className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between gap-2 min-h-[44px] ${
                    isCurrent
                      ? 'bg-amber-50/70 border border-amber-300'
                      : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg ${u.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{u.role}</p>
                      <p className="text-[10px] text-gray-500 truncate">{u.desc}</p>
                    </div>
                  </div>
                  {isCurrent ? (
                    <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                      Active
                    </span>
                  ) : isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-400 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
            All demo passwords: <span className="font-mono text-gray-600 font-semibold">Password123!</span>
          </div>
        </div>
      )}
    </div>
  );
}
