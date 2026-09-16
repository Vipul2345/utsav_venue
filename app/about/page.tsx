'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Users,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Award,
  ArrowRight,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-amber-100/30 to-transparent pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-amber-100 text-center">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>India's Premier Celebration Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-tight">
            Transforming How India <br />
            <span className="bg-gradient-to-r from-brand-600 via-amber-700 to-amber-600 bg-clip-text text-transparent">
              Discovers & Books Event Venues
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-600 leading-relaxed">
            UTSAV VENUES brings trust, transparency, and technology to the luxury banquet hall industry. 
            We eliminate broker markups, eliminate double-bookings, and empower both hosts and hall managers.
          </p>
        </div>
      </section>

      {/* Core Mission & Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest">
              <Award className="w-4 h-4" />
              <span>Our Platform Mission</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              A celebration happens once in a lifetime. Your venue booking should be flawless.
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Traditional venue booking in India has long been burdened with opaque pricing, hidden maintenance fees, 
              unverified broker photos, and heartbreaking accidental double-bookings during auspicious wedding dates.
            </p>
            <p className="text-sm text-stone-600 leading-relaxed">
              UTSAV VENUES was architected from the ground up as a high-concurrency marketplace with an authoritative 
              server-side pricing engine, 10-minute automated reservation locks, verified occasion-specific approvals, 
              and physical hall verification by our compliance officers.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
                <div className="text-2xl font-black text-amber-800">100%</div>
                <div className="text-xs font-bold text-stone-700 mt-1">Verified Venues</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Every listed hall is physically inspected</div>
              </div>
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
                <div className="text-2xl font-black text-amber-800">0%</div>
                <div className="text-xs font-bold text-stone-700 mt-1">Double Bookings</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Atomic transaction locks prevent overlaps</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80"
                alt="Luxury Banquet Hall"
                className="w-full h-[420px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-stone-900 text-white p-5 rounded-2xl shadow-xl max-w-xs border border-amber-400/30">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-extrabold uppercase">Platform Guarantee</span>
              </div>
              <p className="text-xs text-stone-300">
                10-minute temporary payment holds ensure your chosen date and slot are held exclusively for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Pillars: Customers vs Hall Managers */}
      <section className="bg-stone-50/70 border-y border-stone-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Designed for Both Hosts and Venue Owners
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              A balanced ecosystem connecting families planning milestones with premier hospitality providers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Customers */}
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-stone-900">For Families & Event Hosts</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Discover dream banquet halls, palaces, and lawn resorts with absolute confidence and transparent financial breakdown.
                </p>

                <ul className="space-y-2.5 text-xs text-stone-600 pt-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Transparent Per-Plate Pricing:</strong> Exact calculations for Veg/Non-Veg catering and venue rentals with zero surprise add-ons.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>10-Minute Concurrency Hold:</strong> When you start checkout, the slot is locked exclusively for you.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Verified Reviews Only:</strong> Reviews can only be submitted by customers who held a confirmed, completed booking.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Automated Refund Guarantee:</strong> Transparent tiered cancellation policies with instant refund accounting.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900"
                >
                  <span>Explore Available Venues</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* For Hall Managers */}
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-stone-900">For Banquet Hall Managers</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Turn your venue into a full digital operation with calendar synchronization, offline walk-in tracking, and automated payout ledgers.
                </p>

                <ul className="space-y-2.5 text-xs text-stone-600 pt-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Visual Slot Calendar:</strong> View confirmed, held, and maintenance slots on an interactive timeline.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>0% Commission on Direct Walk-ins:</strong> Record phone and in-person bookings directly into the platform with zero commission.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Automated Payout Ledgers:</strong> Complete financial breakdown of customer payments, platform commissions, and net earnings.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Occasion Moderation:</strong> Showcase specialized wedding mandaps, corporate AV equipment, and catering packages.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <Link
                  href="/register?role=MANAGER"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900"
                >
                  <span>List Your Venue On Utsav Venues</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Verification Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Our Platform Standards
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Every booking is backed by enterprise-grade guarantees and strict compliance checks
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-2 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-brand-600" />
            <h4 className="text-sm font-bold text-stone-900">Rigorous KYC Verification</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Every manager must submit business registration licenses and tax identification before any hall can receive admin approval.
            </p>
          </div>

          <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-2 shadow-sm">
            <Clock className="w-8 h-8 text-amber-600" />
            <h4 className="text-sm font-bold text-stone-900">Instant Availability Sync</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              When a slot is booked or blocked, every customer searching across India sees live availability update immediately.
            </p>
          </div>

          <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-2 shadow-sm">
            <HeartHandshake className="w-8 h-8 text-emerald-600" />
            <h4 className="text-sm font-bold text-stone-900">Transparent Platform Pricing</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Base rental, weekend multipliers, GST taxes, security deposits, and cleaning fees are disclosed up-front before payment.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-2xl border border-amber-500/20">
          <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to Plan Your Next Grand Event?
          </h3>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-stone-300">
            Browse verified banquet halls, view real guest photos, check slot availability, and reserve with zero double-booking risk.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/search"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-900 font-extrabold text-xs rounded-xl shadow-lg transition"
            >
              Find Banquet Halls
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition"
            >
              Contact Hospitality Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
