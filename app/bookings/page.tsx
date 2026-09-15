'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Star,
  RefreshCw,
  Search,
} from 'lucide-react';

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'CANCELLED'>('UPCOMING');

  // Review modal state
  const [reviewModalBooking, setReviewModalBooking] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const upcoming = bookings.filter(
    (b) => (b.status === 'CONFIRMED' || b.status === 'PAYMENT_PENDING') && b.eventDate >= todayStr
  );
  const past = bookings.filter(
    (b) => b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && b.eventDate < todayStr)
  );
  const cancelled = bookings.filter(
    (b) => b.status === 'CANCELLED' || b.status === 'REFUNDED' || b.status === 'HOLD_EXPIRED'
  );

  const displayed =
    activeTab === 'UPCOMING' ? upcoming : activeTab === 'PAST' ? past : cancelled;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalBooking) return;
    setSubmittingReview(true);
    setReviewError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reviewModalBooking.id,
          rating,
          title: reviewTitle,
          content: reviewContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setReviewSuccess(true);
      setTimeout(() => {
        setReviewModalBooking(null);
        setReviewSuccess(false);
        fetchBookings();
      }, 1500);
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">My Venue Bookings</h1>
          <p className="text-xs text-stone-500">Track upcoming celebrations, past events, and booking vouchers</p>
        </div>

        <Link
          href="/search"
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition self-start sm:self-auto"
        >
          Book Another Venue
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`pb-3 transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'UPCOMING'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <span>Upcoming Events</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
            {upcoming.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PAST')}
          className={`pb-3 transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'PAST'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <span>Past Completed</span>
          <span className="px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700 text-[10px]">
            {past.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`pb-3 transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'CANCELLED'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <span>Cancelled & Refunded</span>
          <span className="px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700 text-[10px]">
            {cancelled.length}
          </span>
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
          <p className="text-xs text-stone-500">Loading your bookings...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-bold text-sm text-stone-800">You don't have any {activeTab.toLowerCase()} bookings.</h3>
          <p className="text-xs text-stone-400">Discover and book verified banquet halls in your preferred city.</p>
          <Link href="/search" className="inline-block mt-2 text-xs font-bold text-amber-700 hover:underline">
            Search Available Halls →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                    {b.bookingNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      b.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : b.status === 'PAYMENT_PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {b.status}
                  </span>
                  <span className="text-xs font-semibold text-amber-800">
                    {b.occasion?.name || 'Celebration'}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-stone-900">{b.hall.name}</h3>

                <p className="text-xs text-stone-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{b.hall.locality?.name || b.hall.city?.name}, {b.hall.city?.name}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-700 pt-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    {b.eventDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {b.startTime} - {b.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    {b.guestCount} Guests
                  </span>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex sm:flex-col justify-between items-end gap-3 sm:border-l sm:border-stone-100 sm:pl-6 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Total Paid</span>
                  <span className="text-base font-black text-stone-900">
                    ₹{b.totalAmount.toLocaleString('en-IN')}
                  </span>
                  {b.refundAmount > 0 && (
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      Refunded: ₹{b.refundAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/bookings/${b.id}`}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Voucher</span>
                  </Link>

                  {/* Review CTA if completed and not reviewed yet */}
                  {activeTab === 'PAST' && b.reviews?.length === 0 && (
                    <button
                      onClick={() => setReviewModalBooking(b)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>Write Review</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-stone-900">
              Rate Your Experience at {reviewModalBooking.hall.name}
            </h3>

            {reviewSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-bold">
                Review submitted successfully! Thank you for helping future guests.
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                {reviewError && (
                  <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg">{reviewError}</div>
                )}

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Star Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Review Title</label>
                  <input
                    type="text"
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Magnificent wedding hall and food!"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Your Written Review</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Tell other hosts about the stage, parking, air conditioning, and catering service..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalBooking(null)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow"
                  >
                    {submittingReview ? 'Posting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
