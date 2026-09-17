'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  Heart,
  User,
  LogOut,
  Calendar,
  Building2,
  Shield,
  Menu,
  X,
  Compass,
  Info,
  Mail,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import DemoAccountSwitcher from './DemoAccountSwitcher';
import NotificationsDropdown from './NotificationsDropdown';
import { useModalDismiss } from '@/lib/hooks/useModalDismiss';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useModalDismiss(userMenuRef, () => setUserMenuOpen(false), userMenuOpen);
  useModalDismiss(mobileMenuRef, () => setMobileMenuOpen(false), mobileMenuOpen);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error(e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'POST' });
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const isCustomer = user && user.role === 'CUSTOMER';
  const isManager = user && user.role === 'MANAGER';
  const isAdmin = user && user.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 via-amber-800 to-amber-600 bg-clip-text text-transparent">
                  UTSAV VENUES
                </span>
                <span className="hidden sm:block text-[10px] font-semibold tracking-widest text-amber-700/80 uppercase">
                  Banquet & Event Marketplace
                </span>
              </div>
            </Link>

            {/* Role-Specific Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {/* ANONYMOUS USER NAVIGATION */}
              {!user && (
                <>
                  <Link
                    href="/search"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname.startsWith('/search')
                        ? 'text-brand-600 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Find Venues
                  </Link>
                  <Link
                    href="/about"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname === '/about'
                        ? 'text-brand-600 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    About Us
                  </Link>
                  <Link
                    href="/contact"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname === '/contact'
                        ? 'text-brand-600 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Contact Us
                  </Link>
                </>
              )}

              {/* CUSTOMER NAVIGATION */}
              {isCustomer && (
                <>
                  <Link
                    href="/search"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname.startsWith('/search')
                        ? 'text-brand-600 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Find Venues
                  </Link>
                  <Link
                    href="/bookings"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname.startsWith('/bookings')
                        ? 'text-brand-600 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/about"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname === '/about'
                        ? 'text-brand-600 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    About Us
                  </Link>
                  <Link
                    href="/contact"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname === '/contact'
                        ? 'text-brand-600 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Contact Us
                  </Link>
                </>
              )}

              {/* HALL MANAGER NAVIGATION */}
              {isManager && (
                <>
                  <Link
                    href="/manager"
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      pathname === '/manager'
                        ? 'text-amber-800 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/manager/halls"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname.startsWith('/manager/halls')
                        ? 'text-amber-800 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Venues
                  </Link>
                  <Link
                    href="/manager/calendar"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname.startsWith('/manager/calendar')
                        ? 'text-amber-800 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Calendar & Slots
                  </Link>
                  <Link
                    href="/manager/bookings"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname.startsWith('/manager/bookings')
                        ? 'text-amber-800 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Bookings
                  </Link>
                  <Link
                    href="/manager/payments"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname.startsWith('/manager/payments')
                        ? 'text-amber-800 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Payouts
                  </Link>
                </>
              )}

              {/* ADMINISTRATOR NAVIGATION */}
              {isAdmin && (
                <>
                  <Link
                    href="/admin"
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      pathname === '/admin'
                        ? 'text-purple-800 bg-purple-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Admin Console</span>
                  </Link>
                  <Link
                    href="/admin/halls"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname.startsWith('/admin/halls')
                        ? 'text-purple-800 bg-purple-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Halls
                  </Link>
                  <Link
                    href="/admin/bookings"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname.startsWith('/admin/bookings')
                        ? 'text-purple-800 bg-purple-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Bookings
                  </Link>
                  <Link
                    href="/admin/locations"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname.startsWith('/admin/locations')
                        ? 'text-purple-800 bg-purple-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Locations
                  </Link>
                  <Link
                    href="/admin/users"
                    className={`px-3 py-1.5 rounded-lg transition ${
                      pathname.startsWith('/admin/users')
                        ? 'text-purple-800 bg-purple-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Users & Roles
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Role Switcher */}
            <DemoAccountSwitcher currentUser={user} />

            {/* Favorites Icon (Only for Customers or Visitors) */}
            {(!user || isCustomer) && (
              <Link
                href="/favorites"
                className="p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
                title="Saved Venues"
              >
                <Heart className="w-5 h-5" />
              </Link>
            )}

            {/* In-App Notifications (For logged in users) */}
            {user && <NotificationsDropdown user={user} />}

            {/* User Account / Sign In */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-gray-200 hover:border-amber-400 bg-gray-50 hover:bg-white transition text-xs font-semibold text-gray-800"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.fullName}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      isAdmin
                        ? 'bg-purple-100 text-purple-800'
                        : isManager
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isAdmin ? user.adminProfile?.adminRole || 'ADMIN' : user.role}
                  </span>
                </button>

                {userMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs"
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-bold text-gray-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>

                    {isCustomer && (
                      <>
                        <Link
                          href="/bookings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                        >
                          <Calendar className="w-4 h-4 text-amber-600" />
                          My Bookings
                        </Link>
                        <Link
                          href="/favorites"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                        >
                          <Heart className="w-4 h-4 text-rose-500" />
                          Saved Venues
                        </Link>
                      </>
                    )}

                    {isManager && (
                      <>
                        <Link
                          href="/manager"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                        >
                          <Building2 className="w-4 h-4 text-amber-600" />
                          Manager Dashboard
                        </Link>
                        <Link
                          href="/manager/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                        >
                          <User className="w-4 h-4 text-stone-600" />
                          Business Profile
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                      >
                        <Shield className="w-4 h-4 text-purple-600" />
                        Admin Console
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      Account Settings
                    </Link>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-full transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-block px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 rounded-full shadow-sm transition"
                >
                  List Venue
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-700 hover:bg-amber-50 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center transition"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Role-Specific Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 bg-stone-900/50 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-150"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={mobileMenuRef}
            className="md:hidden fixed top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto z-40 bg-white border-b border-stone-200 shadow-2xl px-5 pt-3 pb-6 space-y-1 animate-in slide-in-from-top-2 duration-150"
          >
            {/* Anonymous Mobile Menu */}
            {!user && (
              <>
                <Link
                  href="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  Find Venues
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  About Us
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  Contact Us
                </Link>
                <div className="pt-3 border-t border-stone-100 flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 min-h-[44px] flex items-center justify-center text-center py-2.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 min-h-[44px] flex items-center justify-center text-center py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-amber-600 rounded-xl shadow transition"
                  >
                    Register
                  </Link>
                </div>
              </>
            )}

            {/* Customer Mobile Menu */}
            {isCustomer && (
              <>
                <Link
                  href="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  Find Venues
                </Link>
                <Link
                  href="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  My Bookings
                </Link>
                <Link
                  href="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  Saved Venues
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  About Us
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  Contact Us
                </Link>
              </>
            )}

            {/* Manager Mobile Menu */}
            {isManager && (
              <>
                <Link
                  href="/manager"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-amber-800 hover:bg-amber-50 transition"
                >
                  Manager Dashboard
                </Link>
                <Link
                  href="/manager/halls"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  My Venues
                </Link>
                <Link
                  href="/manager/calendar"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  Calendar & Slots
                </Link>
                <Link
                  href="/manager/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  Bookings
                </Link>
                <Link
                  href="/manager/payments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  Payouts
                </Link>
              </>
            )}

            {/* Admin Mobile Menu */}
            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-purple-800 hover:bg-purple-50 transition"
                >
                  Admin Dashboard
                </Link>
                <Link
                  href="/admin/halls"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-purple-50 transition"
                >
                  Hall Moderation
                </Link>
                <Link
                  href="/admin/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-purple-50 transition"
                >
                  Bookings
                </Link>
                <Link
                  href="/admin/locations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-purple-50 transition"
                >
                  Location Management
                </Link>
                <Link
                  href="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-purple-50 transition"
                >
                  User & Admin Management
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
}
