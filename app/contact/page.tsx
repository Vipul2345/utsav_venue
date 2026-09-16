'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Headphones,
} from 'lucide-react';
import {
  isValidEmail,
  isValidPhone,
  validateRequiredString,
} from '@/lib/validation';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 1. Frontend validation
    const nameVal = validateRequiredString(name, 'Full Name', 2, 100);
    if (!nameVal.isValid) {
      setError(nameVal.error || 'Please enter your name.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (phone && !isValidPhone(phone)) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    const subjectVal = validateRequiredString(subject, 'Subject', 3, 150);
    if (!subjectVal.isValid) {
      setError(subjectVal.error || 'Please provide a subject.');
      return;
    }

    const messageVal = validateRequiredString(message, 'Message', 10, 2000);
    if (!messageVal.isValid) {
      setError(messageVal.error || 'Message must be at least 10 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setSuccess(
        data.message ||
          'Thank you! Your message has been received. Our hospitality concierge team will contact you shortly.'
      );
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <section className="bg-gradient-to-b from-amber-500/10 via-amber-100/30 to-transparent pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-amber-100 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Headphones className="w-3.5 h-3.5 text-amber-700" />
            <span>24/7 Celebration Concierge</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight">
            Contact Hospitality Support
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
            Have questions about a banquet hall booking, catering packages, or listing your venue? 
            Our dedicated team is here to assist hosts and hall managers across India.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">Get in Touch</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Reach out through any of our channels or submit the inquiry form.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Email */}
                <div className="flex items-start gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900">Email Inquiries</div>
                    <a
                      href="mailto:support@utsavvenues.com"
                      className="text-brand-700 hover:underline font-mono"
                    >
                      support@utsavvenues.com
                    </a>
                    <div className="text-[11px] text-stone-400 mt-0.5">Response within 2 hours</div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900">Concierge Helpline</div>
                    <a href="tel:+918040005000" className="text-brand-700 hover:underline font-mono">
                      +91 80 4000 5000
                    </a>
                    <div className="text-[11px] text-stone-400 mt-0.5">Toll-free, 9 AM – 9 PM IST</div>
                  </div>
                </div>

                {/* Headquarters */}
                <div className="flex items-start gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900">Hospitality Hub</div>
                    <div className="text-stone-600 leading-relaxed font-medium">
                      100 Feet Road, HAL 2nd Stage, <br />
                      Indiranagar, Bangalore - 560038, Karnataka
                    </div>
                  </div>
                </div>

                {/* Support Hours */}
                <div className="flex items-start gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900">Operating Hours</div>
                    <div className="text-stone-600">Monday – Sunday: 8:00 AM – 10:00 PM IST</div>
                    <div className="text-[11px] text-stone-400 mt-0.5">Emergency booking support active 24/7</div>
                  </div>
                </div>
              </div>

              {/* Manager Portal Callout */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-2">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>Venue Partnership Inquiries</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Are you a banquet hall or palace owner seeking to list your property? Apply for instant onboarding.
                </p>
                <Link
                  href="/register?role=MANAGER"
                  className="inline-block text-xs font-extrabold text-brand-700 hover:underline"
                >
                  Join as Hall Manager →
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">Send Us a Message</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Fill out the form below and an event specialist will reach out to you.
                </p>
              </div>

              {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm text-emerald-900 mb-0.5">Inquiry Sent Successfully!</div>
                    <p className="leading-relaxed">{success}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikramaditya Rao"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="vikram@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                      Mobile Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Wedding Hall Availability in Mumbai"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                    Message Details *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us about your event date, estimated guest count, occasion type, or specific questions..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-amber-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Submitting Inquiry...' : 'Submit Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
