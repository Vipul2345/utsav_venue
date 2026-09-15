'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

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
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              <span>Manager Contact: {booking.hall.contactPhone}</span>
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

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
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
