import React from 'react';
import Link from 'next/link';
import { Sparkles, Heart, Shield, Building2, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-amber-900/40 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-wider">UTSAV VENUES</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              India’s premier banquet hall and event venue marketplace. Discover verified venues for weddings, receptions, engagements, corporate conferences, and milestones.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>100% Admin Verified Venues & Double-Booking Protection</span>
            </div>
          </div>

          {/* Popular Cities */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Popular Cities</h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li><Link href="/search?city=bangalore" className="hover:text-amber-300 transition py-0.5 inline-block">Bangalore Banquet Halls</Link></li>
              <li><Link href="/search?city=mumbai" className="hover:text-amber-300 transition py-0.5 inline-block">Mumbai Oceanfront Venues</Link></li>
              <li><Link href="/search?city=delhi-ncr" className="hover:text-amber-300 transition py-0.5 inline-block">Delhi NCR Wedding Farms</Link></li>
              <li><Link href="/search?city=hyderabad" className="hover:text-amber-300 transition py-0.5 inline-block">Hyderabad Royal Palaces</Link></li>
              <li><Link href="/search?city=chennai" className="hover:text-amber-300 transition py-0.5 inline-block">Chennai Coastal Lawns</Link></li>
            </ul>
          </div>

          {/* Occasions */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Celebrations</h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li><Link href="/search?occasion=wedding" className="hover:text-amber-300 transition py-0.5 inline-block">Grand Weddings & Pheras</Link></li>
              <li><Link href="/search?occasion=reception" className="hover:text-amber-300 transition py-0.5 inline-block">Dinner Receptions</Link></li>
              <li><Link href="/search?occasion=engagement" className="hover:text-amber-300 transition py-0.5 inline-block">Ring Ceremonies</Link></li>
              <li><Link href="/search?occasion=corporate-event" className="hover:text-amber-300 transition py-0.5 inline-block">Corporate Galas & Summits</Link></li>
              <li><Link href="/search?occasion=birthday-party" className="hover:text-amber-300 transition py-0.5 inline-block">Milestone Birthday Parties</Link></li>
            </ul>
          </div>

          {/* For Venue Owners */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">For Venue Owners</h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li><Link href="/list-your-venue" className="hover:text-amber-300 transition py-0.5 inline-block">Partner Guide & Commission</Link></li>
              <li><Link href="/register?role=MANAGER" className="hover:text-amber-300 transition py-0.5 inline-block">List Your Venue</Link></li>
              <li><Link href="/login" className="hover:text-amber-300 transition py-0.5 inline-block">Manager Portal Sign In</Link></li>
              <li><Link href="/contact" className="hover:text-amber-300 transition py-0.5 inline-block">Partner Support Desk</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-300">
          <p>© 2026 UTSAV Venues Marketplace. Verified banquet halls with zero double-booking guarantee.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <Link href="/about" className="hover:text-white transition">About Us</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
            <Link href="/list-your-venue" className="hover:text-white transition">How It Works</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
