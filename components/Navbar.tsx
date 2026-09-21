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
  Scale,
} from 'lucide-react';
import DemoAccountSwitcher from './DemoAccountSwitcher';
import NotificationsDropdown from './NotificationsDropdown';
import SmartEventBriefModal from './SmartEventBriefModal';
import { useModalDismiss } from '@/lib/hooks/useModalDismiss';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [smartBriefOpen, setSmartBriefOpen] = useState(false);

  useEffect(() => {
    const handleOpenSmartBrief = () => setSmartBriefOpen(true);
    window.addEventListener('utsav_open_smart_brief', handleOpenSmartBrief);
    return () => window.removeEventListener('utsav_open_smart_brief', handleOpenSmartBrief);
  }, []);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  useModalDismiss(userMenuRef, () => setUserMenuOpen(false), userMenuOpen);
  useModalDismiss(mobileMenuRef, () => setMobileMenuOpen(false), mobileMenuOpen, mobileMenuButtonRef);

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
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="shrink-0">
                <span className="text-sm xs:text-base sm:text-xl font-black tracking-tight bg-gradient-to-r from-brand-600 via-amber-800 to-amber-600 bg-clip-text text-transparent whitespace-nowrap block">
                  UTSAV VENUES
                </span>
                <span className="hidden sm:block text-[10px] font-semibold tracking-widest text-amber-700/80 uppercase">
                  Banquet & Event Marketplace
                </span>
              </div>
            </Link>

            {/* Role-Specific Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
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
                    href="/compare"
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                      pathname.startsWith('/compare')
                        ? 'text-brand-600 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-700" />
                    <span>Compare</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSmartBriefOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-brand-700 hover:bg-amber-50 font-semibold transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Plan Event</span>
                  </button>
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
                    href="/compare"
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                      pathname.startsWith('/compare')
                        ? 'text-brand-600 bg-amber-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-700" />
                    <span>Compare</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSmartBriefOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-brand-700 hover:bg-amber-50 font-semibold transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Plan Event</span>
                  </button>
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
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Quick Demo Role Switcher (Visible on desktop/tablet, shifted to mobile menu drawer on mobile) */}
            <div className="hidden sm:block">
              <DemoAccountSwitcher currentUser={user} />
            </div>

            {/* Favorites Icon (Hidden on small mobile to give plenty of room to logo & account; accessible in drawer & account menu) */}
            {(!user || isCustomer) && (
              <Link
                href="/favorites"
                className="hidden sm:flex p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-full transition min-w-[36px] min-h-[36px] items-center justify-center"
                title="Saved Venues"
                aria-label="Saved Venues"
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
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUserMenuOpen((prev) => !prev);
                    setMobileMenuOpen(false);
                  }}
                  aria-label="User account menu"
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-2 sm:pr-3 sm:py-1 rounded-full border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-white transition text-xs font-semibold text-stone-800 min-h-[36px]"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:inline max-w-[90px] truncate">{user.fullName}</span>
                  <span
                    className={`hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
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
                  <>
                    {/* Mobile Backdrop for User Menu */}
                    <div
                      className="fixed inset-0 top-16 bg-stone-900/40 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
                      onClick={() => setUserMenuOpen(false)}
                      aria-hidden="true"
                    />

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="fixed sm:absolute top-16 sm:top-full left-3 right-3 sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-60 bg-white border border-stone-200 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs"
                    >
                      <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="font-extrabold text-stone-900 truncate">{user.fullName}</p>
                          <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                            isAdmin
                              ? 'bg-purple-100 text-purple-800'
                              : isManager
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isAdmin ? user.adminProfile?.adminRole || 'ADMIN' : user.role}
                        </span>
                      </div>

                      <div className="py-1">
                        {isCustomer && (
                          <>
                            <Link
                              href="/bookings"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-50 text-stone-700 font-medium transition min-h-[40px]"
                            >
                              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>My Bookings</span>
                            </Link>
                            <Link
                              href="/favorites"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-50 text-stone-700 font-medium transition min-h-[40px]"
                            >
                              <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>Saved Venues</span>
                            </Link>
                          </>
                        )}

                        {isManager && (
                          <>
                            <Link
                              href="/manager"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-50 text-stone-700 font-medium transition min-h-[40px]"
                            >
                              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Manager Dashboard</span>
                            </Link>
                            <Link
                              href="/manager/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-50 text-stone-700 font-medium transition min-h-[40px]"
                            >
                              <User className="w-4 h-4 text-stone-600 shrink-0" />
                              <span>Business Profile</span>
                            </Link>
                          </>
                        )}

                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-50 text-stone-700 font-medium transition min-h-[40px]"
                          >
                            <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>Admin Console</span>
                          </Link>
                        )}

                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-50 text-stone-700 font-medium transition min-h-[40px]"
                        >
                          <User className="w-4 h-4 text-stone-500 shrink-0" />
                          <span>Account Settings</span>
                        </Link>
                      </div>

                      <div className="border-t border-stone-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-bold transition min-h-[40px]"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  </>
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

            {/* Mobile / Tablet Plan Event Quick Trigger */}
            <button
              type="button"
              onClick={() => setSmartBriefOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-300/80 text-amber-900 hover:bg-amber-500/25 text-xs font-black transition shadow-xs cursor-pointer"
              aria-label="Open Plan Event Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Plan</span>
            </button>

            {/* Mobile / Tablet menu toggle */}
            <button
              ref={mobileMenuButtonRef}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobileMenuOpen((prev) => !prev);
                setUserMenuOpen(false);
              }}
              className="lg:hidden p-2 text-stone-700 hover:bg-amber-50 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-stone-900" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Role-Specific Mobile & Tablet Nav Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 bg-stone-900/50 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-150"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={mobileMenuRef}
            className="lg:hidden fixed top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto z-40 bg-white border-b border-stone-200 shadow-2xl px-5 pt-3 pb-6 space-y-2.5 animate-in slide-in-from-top-2 duration-150"
          >
            {/* Mobile & Tablet Drawer Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-white text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-extrabold text-stone-800 uppercase tracking-wider">
                  Menu & Account
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg text-xs font-bold flex items-center gap-1 min-h-[36px] px-2.5 bg-stone-50 border border-stone-200/60 cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4 text-stone-700" />
                <span>Close</span>
              </button>
            </div>

            {/* Mobile Feature Parity: Plan Event & Compare Hub */}
            <div className="grid grid-cols-2 gap-2 pb-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSmartBriefOpen(true);
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-brand-500/15 border border-amber-300/80 text-stone-900 font-black text-xs hover:bg-amber-100 transition shadow-xs text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-black text-stone-900 text-xs truncate">Plan Event</div>
                  <div className="text-[10px] text-amber-900/80 font-medium truncate">Smart Assistant</div>
                </div>
              </button>

              <Link
                href="/compare"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200/90 text-stone-900 font-black text-xs hover:bg-amber-50 transition shadow-xs text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-stone-200 flex items-center justify-center text-stone-700 shrink-0">
                  <Scale className="w-4 h-4 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <div className="font-black text-stone-900 text-xs truncate">Compare</div>
                  <div className="text-[10px] text-stone-500 font-medium truncate">Shortlist Matrix</div>
                </div>
              </Link>
            </div>

            {/* Quick Demo Role Switcher */}
            <div className="pb-3 border-b border-stone-100 sm:hidden">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5 px-1">
                Demo Quick Role Switcher
              </span>
              <DemoAccountSwitcher currentUser={user} />
            </div>

            {/* Mobile Logged-in User Account Card */}
            {user && (
              <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-3.5 space-y-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-extrabold text-xs text-stone-900 truncate">{user.fullName}</p>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold shrink-0 ${
                          isAdmin
                            ? 'bg-purple-100 text-purple-800'
                            : isManager
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isAdmin ? user.adminProfile?.adminRole || 'ADMIN' : user.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/60 grid grid-cols-2 gap-1.5 text-xs font-semibold">
                  {isCustomer && (
                    <>
                      <Link
                        href="/bookings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-stone-200/60 text-stone-700 hover:text-amber-800 min-h-[40px]"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">My Bookings</span>
                      </Link>
                      <Link
                        href="/favorites"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-stone-200/60 text-stone-700 hover:text-rose-600 min-h-[40px]"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">Saved Venues</span>
                      </Link>
                    </>
                  )}
                  {isManager && (
                    <>
                      <Link
                        href="/manager"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-stone-200/60 text-stone-700 hover:text-amber-800 min-h-[40px]"
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">Dashboard</span>
                      </Link>
                      <Link
                        href="/manager/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-stone-200/60 text-stone-700 hover:text-stone-900 min-h-[40px]"
                      >
                        <User className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                        <span className="truncate">Profile</span>
                      </Link>
                    </>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="col-span-2 flex items-center gap-1.5 p-2 rounded-xl bg-white border border-purple-200 text-purple-900 min-h-[40px]"
                    >
                      <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Admin Console</span>
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-stone-200/60 text-stone-700 min-h-[40px]"
                  >
                    <User className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-700 hover:bg-rose-100 min-h-[40px] text-xs font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
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
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSmartBriefOpen(true);
                  }}
                  className="w-full flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-brand-700 hover:bg-amber-50 transition text-left cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Plan Event Assistant</span>
                </button>
                <Link
                  href="/compare"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  <Scale className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Compare Venues</span>
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
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSmartBriefOpen(true);
                  }}
                  className="w-full flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-brand-700 hover:bg-amber-50 transition text-left cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Plan Event Assistant</span>
                </button>
                <Link
                  href="/compare"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-amber-50 transition"
                >
                  <Scale className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Compare Venues</span>
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

      {/* Mobile Drawer */}
    </header>

    {/* Global Smart Event Brief Assistant Modal */}
    <SmartEventBriefModal
      isOpen={smartBriefOpen}
      onClose={() => setSmartBriefOpen(false)}
    />
  </>
);
}
