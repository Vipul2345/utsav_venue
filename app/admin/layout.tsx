'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Building2,
  Sparkles,
  UserCheck,
  BookOpen,
  CreditCard,
  Users,
  Star,
  FileText,
  Settings,
  Lock,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

const ALL_ADMIN_NAV = [
  { name: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard, perm: null },
  { name: 'Hall Moderation', href: '/admin/halls', icon: Building2, perm: 'view_halls' },
  { name: 'Occasion Approvals', href: '/admin/occasions', icon: Sparkles, perm: 'approve_occasions' },
  { name: 'Manager Verification', href: '/admin/managers', icon: UserCheck, perm: 'view_managers' },
  { name: 'Bookings Oversight', href: '/admin/bookings', icon: BookOpen, perm: 'view_bookings' },
  { name: 'Payments & Revenue', href: '/admin/payments', icon: CreditCard, perm: 'view_payments' },
  { name: 'User Management', href: '/admin/users', icon: Users, perm: 'view_users' },
  { name: 'Review Moderation', href: '/admin/reviews', icon: Star, perm: 'view_reviews' },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText, perm: 'view_audit_logs' },
  { name: 'Platform Settings', href: '/admin/settings', icon: Settings, perm: 'manage_settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.user || data.user.role !== 'ADMIN') {
          router.push('/login?redirect=/admin');
          return;
        }
        setAdminUser(data.user);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="py-24 text-center text-xs font-bold text-stone-400">Verifying Admin Privileges...</div>;
  }

  const role = adminUser?.adminProfile?.adminRole || 'ADMIN';
  const permissions: string[] = adminUser?.adminProfile?.permissions || [];
  const isSuper = role === 'SUPER_ADMIN';

  // Filter navigation items based on role / granted permissions
  const accessibleNav = ALL_ADMIN_NAV.filter((item) => {
    if (!item.perm) return true;
    if (isSuper) return true;
    return permissions.includes(item.perm);
  });

  return (
    <div className="min-h-screen bg-stone-100/60 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-300 shrink-0 border-r border-stone-800 p-4 space-y-6">
        <div className="flex items-center gap-2.5 px-2 py-2 border-b border-stone-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider">Marketplace Admin</h2>
            <p className="text-[10px] text-purple-400 font-bold">{role.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1 text-xs font-semibold">
          {accessibleNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
                  isActive
                    ? 'bg-purple-600 text-white font-bold shadow'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Exit back to marketplace */}
        <div className="pt-6 border-t border-stone-800">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-stone-400 hover:text-white text-xs font-medium rounded-xl hover:bg-stone-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Marketplace</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl overflow-y-auto">{children}</main>
    </div>
  );
}
