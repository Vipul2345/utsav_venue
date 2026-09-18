'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Printer,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  ArrowLeft,
  Star,
  Send,
  Upload,
  FileCheck,
  Lock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useModalDismiss } from '@/lib/hooks/useModalDismiss';

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Review submission state
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Digital Invitations State
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Identity Documents (KYC) State
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [docMemberName, setDocMemberName] = useState('');
  const [docMemberRole, setDocMemberRole] = useState('Primary Host');
  const [docType, setDocType] = useState('Aadhaar Card');
  const [docFileUrl, setDocFileUrl] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [docStatus, setDocStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const cancelModalRef = useRef<HTMLDivElement>(null);

  useModalDismiss(cancelModalRef, () => setShowCancelModal(false), showCancelModal);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) throw new Error('Booking not found or unauthorized');
      const data = await res.json();
      setBooking(data.booking);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoadingInvitations(true);
      const res = await fetch(`/api/bookings/${bookingId}/invitations`);
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingInvitations(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const res = await fetch(`/api/bookings/${bookingId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    if (booking?.status === 'CONFIRMED' || booking?.status === 'COMPLETED') {
      fetchInvitations();
      fetchDocuments();
    }
  }, [booking?.status, bookingId]);

  const handleSendInvitations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmails.trim()) return;
    setSendingInvitations(true);
    setInvitationStatus(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipientEmails,
          customMessage: invitationMessage,
          eventTitle: `${booking.occasion?.name || 'Event Celebration'} at ${booking.hall.name}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch invitations');
      setInvitationStatus({ type: 'success', message: `Dispatched ${data.count} digital invitation(s) successfully.` });
      setRecipientEmails('');
      setInvitationMessage('');
      await fetchInvitations();
    } catch (err: any) {
      setInvitationStatus({ type: 'error', message: err.message });
    } finally {
      setSendingInvitations(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docMemberName.trim() || !docFileUrl.trim()) return;
    setSubmittingDoc(true);
    setDocStatus(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberName: docMemberName.trim(),
          memberRole: docMemberRole,
          documentType: docType,
          fileUrl: docFileUrl.trim(),
          fileName: `${docMemberName.trim().replace(/\s+/g, '_')}_${docType.replace(/\s+/g, '_')}.pdf`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit document');
      setDocStatus({ type: 'success', message: 'Identity document securely uploaded for compliance verification.' });
      setDocMemberName('');
      setDocFileUrl('');
      await fetchDocuments();
    } catch (err: any) {
      setDocStatus({ type: 'error', message: err.message });
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setSubmittingReview(true);
    setReviewError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          hallId: booking.hall.id,
          rating,
          title: reviewTitle,
          content: reviewContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setReviewSuccess(true);
      await fetchBooking();
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handleCancelBooking = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason || 'Host schedule change' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');

      setCancelSuccess(
        `Booking cancelled successfully. Refund amount: ₹${data.refundAmount?.toLocaleString('en-IN') || 0}.`
      );
      setTimeout(() => {
        setShowCancelModal(false);
        fetchBooking();
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-xs font-bold text-stone-500">
        Loading booking voucher...
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900">Booking Access Error</h2>
        <p className="text-xs text-stone-500">{error || 'Unable to retrieve booking record'}</p>
        <Link href="/bookings" className="inline-block px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl">
          Back to My Bookings
        </Link>
      </div>
    );
  }

  const payment = booking.payments?.[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/bookings"
          className="flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bookings</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Voucher</span>
          </button>

          {booking.status === 'CONFIRMED' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition"
            >
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      {/* Official Voucher Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-lg space-y-8 print:border-none print:shadow-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-black tracking-tight text-stone-900">UTSAV VENUES</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                Official Booking Voucher
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Booking Ref: <strong className="font-mono text-stone-900">{booking.bookingNumber}</strong>
            </p>
            <p className="text-[11px] text-stone-400">
              Booked on {new Date(booking.createdAt).toLocaleDateString([], { dateStyle: 'long' })}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span
              className={`inline-block text-xs font-bold uppercase px-3 py-1 rounded-full ${
                booking.status === 'CONFIRMED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : booking.status === 'COMPLETED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {booking.status}
            </span>
            {payment && (
              <p className="text-[11px] text-stone-500 mt-1">
                Paid via {payment.provider} ({payment.paymentNumber})
              </p>
            )}
          </div>
        </div>

        {/* Venue & Event Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-stone-400 uppercase text-[10px]">Venue Location</h4>
            <h3 className="text-base font-extrabold text-stone-900">{booking.hall.name}</h3>
            <p className="text-stone-600 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{booking.hall.address}, {booking.hall.city?.name}</span>
            </p>
            <p className="text-stone-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>Utsav Concierge Support: 1800-UTSAV-CARE (24/7 Dedicated Care)</span>
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-stone-400 uppercase text-[10px]">Event Schedule</h4>
            <div className="space-y-1 text-stone-700">
              <p className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>{booking.eventDate} ({booking.occasion?.name || 'Event'})</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Slot Time: {booking.startTime} – {booking.endTime}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Expected Guests: {booking.guestCount}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Host Details */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Primary Host</span>
            <span className="font-semibold text-stone-900">{booking.customer?.fullName || booking.externalCustomerName}</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Host Email</span>
            <span className="font-semibold text-stone-900">{booking.customer?.email || 'Direct Offline Client'}</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Host Phone</span>
            <span className="font-semibold text-stone-900">{booking.customer?.phone || booking.externalCustomerPhone || 'N/A'}</span>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="space-y-3">
          <h4 className="font-bold text-stone-900 text-xs">Payment & Billing Summary</h4>
          <div className="border border-stone-200 rounded-2xl overflow-hidden text-xs">
            <div className="divide-y divide-stone-100">
              <div className="p-3 flex justify-between">
                <span className="text-stone-600">Base Venue Rental</span>
                <span className="font-semibold">₹{booking.baseRentalAmount.toLocaleString('en-IN')}</span>
              </div>
              {booking.packagePrice > 0 && (
                <div className="p-3 flex justify-between text-purple-700">
                  <span className="font-medium">Event Package ({booking.packageName || 'Curated Bundle'})</span>
                  <span className="font-semibold">₹{booking.packagePrice.toLocaleString('en-IN')}</span>
                </div>
              )}
              {booking.cateringAmount > 0 && (
                <div className="p-3 flex justify-between">
                  <span className="text-stone-600">Gourmet Catering Package</span>
                  <span className="font-semibold">₹{booking.cateringAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {booking.items?.map((item: any) => (
                <div key={item.id} className="p-3 flex justify-between text-stone-600">
                  <span>Add-On: {item.name}</span>
                  <span className="font-semibold">₹{item.total.toLocaleString('en-IN')}</span>
                </div>
              ))}
              {booking.bulkDiscountAmount > 0 && (
                <div className="p-3 flex justify-between text-emerald-700 bg-emerald-50/60 font-medium">
                  <span>Bulk Guest Discount ({booking.bulkDiscountTier || ''})</span>
                  <span className="font-semibold">-₹{booking.bulkDiscountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="p-3 flex justify-between">
                <span className="text-stone-600">Goods & Services Tax (GST 18%)</span>
                <span className="font-semibold">₹{booking.taxesAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3.5 bg-amber-50/50 flex justify-between text-sm font-black text-stone-900">
                <span>Total Amount Paid</span>
                <span>₹{booking.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Review Section */}
        {booking.reviews && booking.reviews.length > 0 ? (
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-6 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>Your Verified Review & Rating</span>
              </h3>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= booking.reviews[0].rating
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-stone-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            {booking.reviews[0].title && (
              <p className="font-bold text-xs text-stone-900">{booking.reviews[0].title}</p>
            )}
            <p className="text-xs text-stone-700 leading-relaxed">{booking.reviews[0].content}</p>
            <p className="text-[10px] text-stone-400">
              Submitted on {new Date(booking.reviews[0].createdAt).toLocaleDateString()}
            </p>
          </div>
        ) : (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && !booking.cancelledAt ? (
          <div className="bg-gradient-to-br from-amber-50/40 via-white to-stone-50 border border-amber-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-600 fill-amber-300" />
                <span>How was your celebration at {booking.hall.name}?</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Share your verified feedback to help other families and event hosts choose the best venue.
              </p>
            </div>

            {reviewSuccess ? (
              <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thank you! Your verified review has been submitted.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3.5 text-xs">
                {reviewError && (
                  <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
                    {reviewError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Your Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                        aria-label={`Rate ${star} stars`}
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
                    <span className="text-xs font-bold text-stone-700 ml-2">
                      {rating === 5
                        ? '5 Stars (Excellent)'
                        : rating === 4
                        ? '4 Stars (Very Good)'
                        : rating === 3
                        ? '3 Stars (Average)'
                        : rating === 2
                        ? '2 Stars (Poor)'
                        : '1 Star (Terrible)'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Review Title</label>
                  <input
                    type="text"
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Exceptional hall, great stage lighting, and delicious food!"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Written Feedback</label>
                  <textarea
                    required
                    rows={3}
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Tell other event planners about the stage, parking, air conditioning, and catering service..."
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2.5 min-h-[44px] bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>{submittingReview ? 'Submitting...' : 'Submit Verified Review'}</span>
                </button>
              </form>
            )}
          </div>
        ) : null}

        {/* Cancellation Notice if applicable */}
        {booking.cancelledAt && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
            <p className="font-bold">Booking Cancelled on {new Date(booking.cancelledAt).toLocaleString()}</p>
            <p>Reason: {booking.cancellationReason}</p>
            <p className="font-semibold text-emerald-800">Refund Issued: ₹{booking.refundAmount.toLocaleString('en-IN')}</p>
          </div>
        )}

        {/* Footer Notes */}
        <div className="pt-4 border-t border-stone-200 text-[10px] text-stone-400 space-y-1">
          <p>This is a computer-generated confirmation voucher. Please present this at venue reception upon entry.</p>
          <p>Venue rules and safety norms apply as per management policy.</p>
        </div>
      </div>

      {/* Host Feature 1: Digital Event Invitations (Visible on confirmed/completed bookings) */}
      {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && !booking.cancelledAt && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-600" />
                <span>Digital Guest Invitations</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Send official invitations with Google Maps location and event schedule directly to your guests.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full self-start sm:self-auto border border-amber-200">
              {invitations.length} Sent
            </span>
          </div>

          {invitationStatus && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                invitationStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {invitationStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{invitationStatus.message}</span>
            </div>
          )}

          {/* Invitation Dispatch Form */}
          <form onSubmit={handleSendInvitations} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Guest Email Addresses * (Comma or newline separated, up to 25 per batch)
              </label>
              <textarea
                required
                rows={3}
                value={recipientEmails}
                onChange={(e) => setRecipientEmails(e.target.value)}
                placeholder="e.g. friend1@gmail.com, family.member@outlook.com"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Custom Invitation Note (Optional)
              </label>
              <input
                type="text"
                value={invitationMessage}
                onChange={(e) => setInvitationMessage(e.target.value)}
                placeholder="e.g. We would be delighted to have you celebrate this special day with us!"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={sendingInvitations || !recipientEmails.trim()}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[42px]"
            >
              <Send className="w-4 h-4" />
              <span>{sendingInvitations ? 'Dispatching Invitations...' : 'Send Branded Email Invitations'}</span>
            </button>
          </form>

          {/* Sent History */}
          {invitations.length > 0 && (
            <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
              <h4 className="font-bold text-stone-700 text-xs">Recent Invitations Dispatched</h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-100 rounded-xl text-xs"
                  >
                    <span className="font-medium text-stone-800">{inv.recipientEmail}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stone-400">
                        {new Date(inv.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Host Feature 2: Identity Document Collection (KYC) (Visible on confirmed/completed bookings) */}
      {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && !booking.cancelledAt && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Guest & Attendee Identity Verification</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Hospitality compliance requires government photo ID registration for primary event attendees (up to 5 members).
              </p>
            </div>
            <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1 rounded-full self-start sm:self-auto">
              {documents.length} / 5 Registered
            </span>
          </div>

          {/* Privacy Notice Banner */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-stone-700">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="font-semibold text-stone-900">Confidential Vault:</strong> Uploaded identity documents are encrypted and accessible strictly to verified Utsav Compliance Officers. <strong>Venue managers never have access</strong> to your personal identity proofs.
            </p>
          </div>

          {docStatus && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                docStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {docStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{docStatus.message}</span>
            </div>
          )}

          {/* Submitted Documents Cards */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-stone-800 text-xs">Registered Attendees</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{doc.memberName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          doc.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>{doc.memberRole} • {doc.documentType}</span>
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>View Proof</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Form (If < 5) */}
          {documents.length < 5 && (
            <form onSubmit={handleUploadDocument} className="pt-2 border-t border-stone-100 space-y-3.5 text-xs">
              <h4 className="font-bold text-stone-800 text-xs">Add Attendee Identity Proof</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Attendee Full Name *</label>
                  <input
                    type="text"
                    required
                    value={docMemberName}
                    onChange={(e) => setDocMemberName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Role / Relation</label>
                  <select
                    value={docMemberRole}
                    onChange={(e) => setDocMemberRole(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Primary Host">Primary Host</option>
                    <option value="Groom">Groom</option>
                    <option value="Bride">Bride</option>
                    <option value="Immediate Family">Immediate Family</option>
                    <option value="Event Coordinator">Event Coordinator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Driving License">Driving License</option>
                    <option value="PAN Card">PAN Card</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Document File URL / Key *</label>
                  <input
                    type="url"
                    required
                    value={docFileUrl}
                    onChange={(e) => setDocFileUrl(e.target.value)}
                    placeholder="https://... or cloud storage document link"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingDoc || !docMemberName.trim() || !docFileUrl.trim()}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[42px]"
              >
                <Upload className="w-4 h-4" />
                <span>{submittingDoc ? 'Uploading...' : 'Submit ID for Verification'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            ref={cancelModalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <h3 className="text-base font-bold text-stone-900">Cancel Booking {booking.bookingNumber}?</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Based on {booking.hall.name}'s policy, cancellations more than {booking.hall.cancellationDeadlineHours || 72} hours in advance receive an automated {booking.hall.refundPercentage || 80}% refund.
            </p>

            {cancelSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold">
                {cancelSuccess}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Cancellation Reason</label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Change of event date / family decision"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl font-bold"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={handleCancelBooking}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow"
                  >
                    {cancelling ? 'Processing...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
