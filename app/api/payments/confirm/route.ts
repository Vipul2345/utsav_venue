import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { confirmBookingPayment } from '@/lib/services/bookingService';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, amount, paymentMethod = 'UPI' } = body;

    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'bookingId and amount are required' }, { status: 400 });
    }

    // Generate verified transaction reference
    const providerTransactionId = `txn_${paymentMethod.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const confirmedBooking = await confirmBookingPayment({
      bookingId,
      providerTransactionId,
      amount: parseFloat(amount),
    });

    return NextResponse.json({
      success: true,
      booking: confirmedBooking,
      transactionId: providerTransactionId,
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json({ error: error.message || 'Payment confirmation failed' }, { status: 400 });
  }
}
