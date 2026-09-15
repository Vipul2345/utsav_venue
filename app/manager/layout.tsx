'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  BookOpen,
  Users,
  CreditCard,
  BarChart3,
  User,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

const MANAGER_NAV = [
  { name: 'Dashboard', href: '/manager', icon: LayoutDashboard },
  { name: 'My Venues', href: '/manager/halls', icon: Building2 },
  { name: 'Calendar & Slots', href: '/manager/calendar', icon: Calendar },
  { name: 'Bookings', href: '/manager/bookings', icon: BookOpen },
  { name: 'Customers', href: '/manager/customers', icon: Users },
  { name: 'Payouts & Earnings', href: '/manager/payments', icon: CreditCard },
  { name: 'Analytics', href: '/manager/analytics', icon: BarChart3 },
  { name: 'Business Profile', href: '/manager/profile', icon: User },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [managerProfile, setManagerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.user || (data.user.role !== 'MANAGER' && data.user.role !== 'ADMIN')) {
          router.push('/login?redirect=/manager');
          return;
        }
        setManagerProfile(data.user.managerProfile);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs font-bold text-stone-400">Verifying Manager Access...</div>;
  }

  const isVerified = managerProfile?.verificationStatus === 'VERIFIED';
  const isPending = managerProfile?.verificationStatus === 'PENDING';

  return (
    <div className="min-h-screen bg-stone-50/50">
      {/* Top Banner if verification is pending */}
      {isPending && (
        <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Manager Account Pending Verification: Administrators are reviewing your submitted business documentation.
          </span>
        </div>
      )}

      {/* Subheader Navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-stone-900 uppercase tracking-wide">
                {managerProfile?.businessName || 'Hospitality Manager Portal'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isVerified
                    ? 'bg-emerald-100 text-emerald-800'
                    : isPending
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {managerProfile?.verificationStatus || 'MANAGER'}
              </span>
            </div>

            <Link
              href="/manager/halls/new"
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>List New Venue</span>
            </Link>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto text-xs font-semibold py-1">
            {MANAGER_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/manager'
                  ? pathname === '/manager'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-100/70 text-amber-900 font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-700" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
    </div>
  );
}
