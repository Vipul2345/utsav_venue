'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, Building2, User, RefreshCw, KeyRound } from 'lucide-react';

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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full shadow-sm transition"
        title="Quickly test any role with one click"
      >
        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
        <span>Quick Demo Login</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-900">Instant Role Switcher</p>
              <p className="text-[10px] text-gray-500">Test marketplace from any user role</p>
            </div>
            {currentUser && (
              <button
                onClick={handleLogout}
                className="text-[10px] font-medium text-rose-600 hover:text-rose-800"
              >
                Sign out
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {DEMO_USERS.map((u) => {
              const Icon = u.icon;
              const isCurrent = currentUser?.email === u.email;
              const isLoading = loading === u.email;

              return (
                <button
                  key={u.email}
                  disabled={isLoading || isCurrent}
                  onClick={() => switchAccount(u.email, u.redirect)}
                  className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition ${
                    isCurrent
                      ? 'bg-amber-50 border border-amber-300'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className={`p-1.5 rounded-md text-white ${u.color} shrink-0 mt-0.5`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-900 truncate">{u.role}</p>
                      {isCurrent && (
                        <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                          Active
                        </span>
                      )}
                      {isLoading && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{u.desc}</p>
                    <p className="text-[9px] text-gray-400 font-mono truncate">{u.email}</p>
                  </div>
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
