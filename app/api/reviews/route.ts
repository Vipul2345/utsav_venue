import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/auditService';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to post a review' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, rating, title, content } = body;

    if (!bookingId || !rating || !content) {
      return NextResponse.json({ error: 'bookingId, rating (1-5), and written review content are required.' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5 stars.' }, { status: 400 });
    }

    // Verify booking eligibility
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        reviews: true,
        hall: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking record not found' }, { status: 404 });
    }

    if (booking.customerId !== session.userId) {
      return NextResponse.json({ error: 'You can only review venues for your own verified bookings.' }, { status: 403 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isEligible = booking.status === 'COMPLETED' || (booking.status === 'CONFIRMED' && booking.eventDate <= todayStr);
    if (!isEligible) {
      return NextResponse.json(
        { error: 'Reviews can only be submitted after your event date has completed.' },
        { status: 400 }
      );
    }

    if (booking.reviews.length > 0) {
      return NextResponse.json({ error: 'You have already submitted a review for this booking.' }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        hallId: booking.hallId,
        customerId: session.userId,
        bookingId: booking.id,
        rating: parseInt(rating, 10),
        title: title?.trim() || null,
        content: content.trim(),
        status: 'APPROVED', // Default approved, admins can moderate/hide
      },
    });

    await createAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: 'REVIEW_CREATED',
      entityType: 'REVIEW',
      entityId: review.id,
      details: { hallId: booking.hallId, rating },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}
