'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Percent,
  Clock,
  Coins,
  FileCheck,
  UploadCloud,
  CalendarCheck2,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export default function ListYourVenuePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-stone-900 via-amber-950 to-stone-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Partner with Utsav Venues</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Grow Your Venue Bookings with Guaranteed Concurrency & Zero Double-Bookings
          </h1>

          <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of premium banquet halls, wedding lawns, and convention centers. Manage custom morning/evening slots, accept verified advance payments, and keep 100% control over your calendar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/register?role=MANAGER"
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>Register as Venue Partner</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
            >
              <span>Manager Portal Login</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4-Step Onboarding Workflow */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">How Venue Onboarding Works</h2>
          <p className="text-sm text-stone-600">Simple, verified, and live in under 48 hours.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base">
              1
            </div>
            <h3 className="font-extrabold text-base text-stone-900">Create Profile</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Sign up as a Hall Manager and input your venue's capacity, indoor/outdoor square footage, and amenities.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
              <Building2 className="w-3.5 h-3.5" />
              <span>Takes ~5 minutes</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base">
              2
            </div>
            <h3 className="font-extrabold text-base text-stone-900">Upload Photos</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Upload high-resolution banquet, lawn, and dining hall photos directly via our fast drag-and-drop uploader.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Direct native upload</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base">
              3
            </div>
            <h3 className="font-extrabold text-base text-stone-900">Document Review</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Our trust team verifies your business PAN/GST and property deed within 24–48 hours for customer peace of mind.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>24–48 hr SLA</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base">
              4
            </div>
            <h3 className="font-extrabold text-base text-stone-900">Go Live & Earn</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Set morning/evening rates, configure catering plates, accept locked bookings, and receive automated 2-day payouts.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
              <Coins className="w-3.5 h-3.5" />
              <span>2-day bank transfers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Commission & Pricing Model */}
      <section className="bg-stone-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black">Transparent Fee Structure</h2>
            <p className="text-stone-400 text-xs sm:text-sm">No hidden maintenance charges, listing fees, or annual subscription traps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-amber-400">Online Platform Bookings</h3>
                <span className="text-2xl font-black text-white">10%</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Applies only when a verified customer discovers and books your venue online through Utsav Venues.
              </p>
              <ul className="space-y-2 text-xs text-stone-300 pt-2 border-t border-white/10">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Includes payment gateway handling & fraud detection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Automated GST invoice generation & customer support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Pessimistic concurrency lock preventing accidental collisions</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-emerald-400">Offline & Walk-in Bookings</h3>
                <span className="text-2xl font-black text-white">0%</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Block dates directly in your Manager Portal for your own offline clients without paying a single rupee.
              </p>
              <ul className="space-y-2 text-xs text-stone-300 pt-2 border-t border-white/10">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instant slot blocking prevents online collisions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Free perpetual access to calendar management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero commission or recurring monthly platform cost</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Required Documentation Checklist */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">What Documents Do You Need?</h2>
          <p className="text-xs sm:text-sm text-stone-600">Keep soft copies ready for quick one-time account approval.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <FileCheck className="w-8 h-8 text-amber-700" />
            <h3 className="font-bold text-sm text-stone-900">Business / Entity PAN & GST</h3>
            <p className="text-xs text-stone-600">Company or proprietor PAN card and optional GSTIN certificate for automated tax compliance.</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <ShieldCheck className="w-8 h-8 text-amber-700" />
            <h3 className="font-bold text-sm text-stone-900">Property Deed or Lease</h3>
            <p className="text-xs text-stone-600">Valid ownership title deed or registered lease agreement confirming operational rights to the premise.</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <Building2 className="w-8 h-8 text-amber-700" />
            <h3 className="font-bold text-sm text-stone-900">Municipal Trade License / NOC</h3>
            <p className="text-xs text-stone-600">Local municipal corporation trade license or fire safety clearance where applicable.</p>
          </div>
        </div>

        {/* Final Registration Callout */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl p-8 text-white text-center space-y-4 shadow-xl">
          <h3 className="text-xl sm:text-2xl font-black">Ready to list your banquet or wedding venue?</h3>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl mx-auto">
            Get discovered by thousands of families and event planners searching for verified venues in your city.
          </p>
          <div className="pt-2">
            <Link
              href="/register?role=MANAGER"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-stone-950 hover:bg-black text-white font-black text-xs sm:text-sm rounded-xl shadow transition"
            >
              <span>Create Free Hall Manager Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
