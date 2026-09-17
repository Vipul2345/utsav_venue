import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { razorpay, RAZORPAY_PUBLIC_KEY } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hall: true, customer: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.customerId !== session.userId && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!razorpay) {
      return NextResponse.json(
        { error: 'Razorpay is not configured on this deployment. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your hosting environment variables.' },
        { status: 500 }
      );
    }

    // Razorpay amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(booking.totalAmount) * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: booking.bookingNumber,
      notes: {
        bookingId: booking.id,
        hallId: booking.hallId,
        hallName: booking.hall.name,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_PUBLIC_KEY,
      bookingNumber: booking.bookingNumber,
      customerName: booking.customer?.fullName || 'Valued Guest',
      customerEmail: booking.customer?.email || '',
      customerPhone: booking.customer?.phone || '',
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create Razorpay order' }, { status: 500 });
  }
}
