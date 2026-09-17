'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Calendar,
  Clock,
  Users,
  MapPin,
  Lock,
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2,
  AlertCircle,
  Timer,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

function BookingCheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hallId = params.hallId as string;

  const occasionId = searchParams.get('occasionId') || '';
  const eventDate = searchParams.get('date') || '';
  const startTime = searchParams.get('startTime') || '16:00';
  const endTime = searchParams.get('endTime') || '23:00';
  const guestCount = parseInt(searchParams.get('guests') || '300', 10);
  const cateringType = (searchParams.get('catering') || 'NONE') as 'NONE' | 'VEG' | 'NON_VEG';
  const selectedAddonIds = searchParams.get('addons')?.split(',').filter(Boolean) || [];

  const [hall, setHall] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Held Booking State
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [isHoldingSlot, setIsHoldingSlot] = useState(false);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(600); // 10 mins

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // 1. Fetch Hall & Check User Auth
  useEffect(() => {
    async function init() {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (!userData.user) {
          // Redirect to login with URL-encoded return path including search parameters
          const queryString = searchParams.toString();
          const returnPath = `/booking/${hallId}${queryString ? `?${queryString}` : ''}`;
          router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
          return;
        }
        setCurrentUser(userData.user);

        const hallRes = await fetch(`/api/halls/${hallId}`);
        if (!hallRes.ok) throw new Error('Venue not found');
        const hallData = await hallRes.json();
        setHall(hallData.hall);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [hallId]);

  // 2. Automatically Hold Slot (Create booking with lock in PAYMENT_PENDING status)
  const holdSlotAndInitiate = async () => {
    if (!hall || !currentUser || createdBooking) return;
    setIsHoldingSlot(true);
    setError(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallId: hall.id,
          occasionId: occasionId || hall.occasions[0]?.occasion.id,
          eventDate,
          startTime,
          endTime,
          guestCount,
          cateringType,
          selectedAddonIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to acquire slot hold');
      }

      setCreatedBooking(data.booking);

      // Initialize hold timer
      if (data.booking.holdExpiresAt) {
        const expiresAt = new Date(data.booking.holdExpiresAt).getTime();
        const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setHoldSecondsRemaining(diff);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsHoldingSlot(false);
    }
  };

  useEffect(() => {
    if (hall && currentUser && !createdBooking && !loading && !error) {
      holdSlotAndInitiate();
    }
  }, [hall, currentUser, loading]);

  // Countdown timer for hold expiration
  useEffect(() => {
    if (!createdBooking || paymentSuccess) return;
    const timer = setInterval(() => {
      setHoldSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('Your 10-minute temporary payment hold has expired. Please select the slot again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [createdBooking, paymentSuccess]);

  // Format seconds to mm:ss
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper to load Razorpay checkout.js script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Real Razorpay Standard Checkout Modal
  const handleRazorpayPayment = async () => {
    if (!createdBooking) return;
    setIsProcessingPayment(true);
    setError(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
      }

      const orderRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: createdBooking.id }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to initialize payment gateway order');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Utsav Venues',
        description: `Booking #${orderData.bookingNumber} - ${hall.name}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.customerPhone,
        },
        theme: {
          color: '#b45309',
        },
        handler: async function (response: any) {
          try {
            const confirmRes = await fetch('/api/payments/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: createdBooking.id,
                amount: createdBooking.totalAmount,
                paymentMethod: 'RAZORPAY',
                providerTransactionId: response.razorpay_payment_id,
                providerSignature: response.razorpay_signature,
              }),
            });

            if (!confirmRes.ok) {
              const cData = await confirmRes.json();
              throw new Error(cData.error || 'Payment verification failed');
            }

            setPaymentSuccess(true);
            setTimeout(() => {
              router.push(`/bookings/${createdBooking.id}`);
            }, 1500);
          } catch (err: any) {
            setError(err.message);
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message);
      setIsProcessingPayment(false);
    }
  };

  // 3. Process Direct Mock Payment Confirmation
  const handleCompletePayment = async () => {
    if (!createdBooking) return;
    setIsProcessingPayment(true);
    setError(null);

    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: createdBooking.id,
          amount: createdBooking.totalAmount,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment confirmation failed');
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        router.push(`/bookings/${createdBooking.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading || isHoldingSlot) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-3">
        <RefreshCw className="w-10 h-10 animate-spin text-amber-600 mx-auto" />
        <h2 className="text-base font-bold text-stone-900">Acquiring Concurrency Lock...</h2>
        <p className="text-xs text-stone-500">Checking database intervals and safely reserving slot during payment hold.</p>
      </div>
    );
  }

  if (error && !createdBooking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4 bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Slot Could Not Be Held</h2>
        <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl">{error}</p>
        <div className="pt-2">
          <Link
            href={`/halls/${hallId}`}
            className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl shadow inline-block"
          >
            ← Return to Venue & Choose Another Time
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Checkout Header with Live Hold Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 to-amber-950 rounded-2xl p-5 text-white shadow-md">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">Review & Secure Venue Booking</h1>
          <p className="text-xs text-stone-400 mt-0.5">Booking Ref: {createdBooking?.bookingNumber || 'Holding...'}</p>
        </div>

        {/* Hold Timer Badge */}
        <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 px-3.5 py-1.5 rounded-xl">
          <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
          <div>
            <span className="text-[10px] text-amber-200 uppercase font-semibold block">Slot Held For</span>
            <span className="text-sm font-black text-white font-mono">{formatTimer(holdSecondsRemaining)}</span>
          </div>
        </div>
      </div>

      {paymentSuccess && (
        <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-center space-y-2 animate-in fade-in">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-bold">Payment Verified & Booking Confirmed!</h2>
          <p className="text-xs text-emerald-700">Slot is permanently locked. Redirecting to your booking voucher...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Venue Summary & Guest Contact */}
        <div className="md:col-span-2 space-y-6">
          {/* Venue & Event Snapshot */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <img
                src={hall.media?.[0]?.url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&q=80'}
                alt={hall.name}
                className="w-full sm:w-28 h-44 sm:h-28 rounded-xl object-cover shrink-0"
              />
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase bg-amber-50 px-2 py-0.5 rounded-full">
                  {hall.city?.name}
                </span>
                <h3 className="font-extrabold text-base text-stone-900">{hall.name}</h3>
                <p className="text-xs text-stone-600">{hall.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-stone-100 text-xs text-stone-800 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>{eventDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>{startTime} - {endTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-700" />
                <span>{guestCount} Guests</span>
              </div>
            </div>
          </div>

          {/* Primary Guest Details */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-stone-900">Host / Booking Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-stone-600 uppercase">Primary Guest</span>
                <p className="font-semibold text-stone-900">{currentUser?.fullName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-600 uppercase">Email Confirmation Sent To</span>
                <p className="font-semibold text-stone-900">{currentUser?.email}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-600 uppercase">Phone</span>
                <p className="font-semibold text-stone-900">{currentUser?.phone || '+91 98450 00000'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-600 uppercase">Catering Selected</span>
                <p className="font-semibold text-stone-900">
                  {cateringType === 'VEG' ? 'Vegetarian Buffet' : cateringType === 'NON_VEG' ? 'Non-Veg & Veg Buffet' : 'No In-House Catering'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Select Payment Method (Simulated Gateway)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3.5 rounded-xl border text-center font-semibold transition min-h-[56px] flex sm:flex-col items-center justify-center gap-2 ${
                  paymentMethod === 'UPI'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <QrCode className="w-5 h-5 text-amber-700 shrink-0" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3.5 rounded-xl border text-center font-semibold transition min-h-[56px] flex sm:flex-col items-center justify-center gap-2 ${
                  paymentMethod === 'CARD'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-700 shrink-0" />
                <span>Credit / Debit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('NETBANKING')}
                className={`p-3.5 rounded-xl border text-center font-semibold transition min-h-[56px] flex sm:flex-col items-center justify-center gap-2 ${
                  paymentMethod === 'NETBANKING'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <Building2 className="w-5 h-5 text-amber-700 shrink-0" />
                <span>Net Banking</span>
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 leading-relaxed">
              Payments are verified server-side with idempotency checks. Once verified, the slot interval is locked permanently in the database.
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Financial Summary */}
        <div className="md:col-span-1">
          <div className="bg-white border border-amber-300 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="font-extrabold text-sm text-stone-900">Payable Breakdown</h3>

            <div className="space-y-2 text-xs border-b border-stone-200 pb-3">
              <div className="flex justify-between text-stone-600">
                <span>Base Venue Hire</span>
                <span>₹{(createdBooking?.baseRentalAmount || 0).toLocaleString('en-IN')}</span>
              </div>

              {createdBooking?.cateringAmount > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Catering Charges</span>
                  <span>₹{(createdBooking?.cateringAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}

              {createdBooking?.addonsAmount > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Add-Ons & Extras</span>
                  <span>₹{(createdBooking?.addonsAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>GST (18%)</span>
                <span>₹{(createdBooking?.taxesAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline text-stone-900">
              <span className="font-bold text-xs uppercase">Total Amount</span>
              <span className="text-xl font-black">
                ₹{(createdBooking?.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Pay Now CTA */}
            {/* Razorpay Standard Checkout CTA */}
            <button
              type="button"
              disabled={isProcessingPayment || paymentSuccess || holdSecondsRemaining === 0}
              onClick={handleRazorpayPayment}
              className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 ${
                !isProcessingPayment && !paymentSuccess && holdSecondsRemaining > 0
                  ? 'bg-gradient-to-r from-brand-600 to-amber-700 hover:from-brand-700 hover:to-amber-800 text-white cursor-pointer'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
            >
              {isProcessingPayment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Opening Gateway...</span>
                </>
              ) : paymentSuccess ? (
                <span>Confirmed!</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pay with Razorpay Gateway</span>
                </>
              )}
            </button>

            {/* Direct Simulation Option */}
            <button
              type="button"
              disabled={isProcessingPayment || paymentSuccess || holdSecondsRemaining === 0}
              onClick={handleCompletePayment}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-[11px] border border-stone-200 hover:bg-stone-50 text-stone-700 transition flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Simulate Instant Confirmation</span>
            </button>

            <div className="text-[10px] text-stone-400 text-center space-y-1">
              <p>256-bit encrypted transaction</p>
              <p>Cancellation subject to venue's {hall.cancellationDeadlineHours || 72}h policy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingCheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-stone-400">Loading checkout...</div>}>
      <BookingCheckoutContent />
    </Suspense>
  );
}
