import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/auditService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hallId = searchParams.get('hallId');
    const bookingId = searchParams.get('bookingId');
    const session = await getSession();

    if (bookingId) {
      const review = await prisma.review.findUnique({
        where: { bookingId },
        include: {
          customer: { select: { fullName: true } },
          hall: { select: { id: true, name: true } },
        },
      });

      // Also check eligibility if user is the booking owner
      let isEligible = false;
      if (session && session.role === 'CUSTOMER') {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { customerId: true, status: true, reviews: { select: { id: true } } },
        });
        if (
          booking &&
          booking.customerId === session.userId &&
          (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') &&
          booking.reviews.length === 0
        ) {
          isEligible = true;
        }
      }

      return NextResponse.json({ review, isEligible });
    }

    if (!hallId) {
      return NextResponse.json({ error: 'hallId or bookingId query parameter is required.' }, { status: 400 });
    }

    // Retrieve approved reviews for this venue
    const reviews = await prisma.review.findMany({
      where: {
        hallId,
        status: 'APPROVED',
      },
      include: {
        customer: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 5.0;

    // Check if currently authenticated customer has an eligible booking for this venue ready to review
    let eligibleBooking: any = null;
    if (session && session.role === 'CUSTOMER') {
      eligibleBooking = await prisma.booking.findFirst({
        where: {
          hallId,
          customerId: session.userId,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          reviews: { none: {} },
        },
        select: {
          id: true,
          bookingNumber: true,
          eventDate: true,
          status: true,
        },
        orderBy: { eventDate: 'desc' },
      });
    }

    return NextResponse.json({
      reviews,
      reviewCount,
      averageRating,
      eligibleBooking,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to post a review.' }, { status: 401 });
    }

    // Strictly enforce that only customers can submit reviews
    if (session.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only verified customers can submit ratings and reviews.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bookingId, hallId, venueId, rating, title, content } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'A valid bookingId is required.' }, { status: 400 });
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5 stars.' }, { status: 400 });
    }

    const trimmedContent = (content || '').trim();
    if (!trimmedContent || trimmedContent.length < 3) {
      return NextResponse.json(
        { error: 'Written review content is required (minimum 3 characters).' },
        { status: 400 }
      );
    }

    if (trimmedContent.length > 2000) {
      return NextResponse.json(
        { error: 'Review content exceeds maximum length of 2,000 characters.' },
        { status: 400 }
      );
    }

    // Retrieve booking record
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        reviews: true,
        hall: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking record not found.' }, { status: 404 });
    }

    // Prevent Cross-Customer Attack: customer can only review their own booking
    if (booking.customerId !== session.userId) {
      return NextResponse.json(
        { error: 'You can only review venues for your own verified bookings.' },
        { status: 403 }
      );
    }

    // Prevent Cross-Venue Attack: target hall must match the booking's actual hall
    const targetHallId = hallId || venueId;
    if (targetHallId && targetHallId !== booking.hallId) {
      return NextResponse.json(
        { error: 'Invalid review target: booking does not belong to the requested venue.' },
        { status: 400 }
      );
    }

    // Prevent review on invalid statuses (CANCELLED, REFUNDED, HOLD_EXPIRED, PAYMENT_PENDING)
    if (
      booking.status === 'CANCELLED' ||
      booking.status === 'REFUNDED' ||
      booking.status === 'HOLD_EXPIRED' ||
      booking.status === 'PAYMENT_PENDING' ||
      booking.status === 'DRAFT'
    ) {
      return NextResponse.json(
        { error: `Reviews cannot be submitted for ${booking.status.toLowerCase()} bookings.` },
        { status: 400 }
      );
    }

    // Eligible booking statuses: COMPLETED or CONFIRMED
    const isEligible = booking.status === 'COMPLETED' || booking.status === 'CONFIRMED';
    if (!isEligible) {
      return NextResponse.json(
        { error: 'Only confirmed or completed bookings are eligible for reviews.' },
        { status: 400 }
      );
    }

    // Enforce 1 review per booking (prevent duplicate reviews)
    if (booking.reviews.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted a review for this booking.' },
        { status: 409 }
      );
    }

    // Create review with status APPROVED
    const review = await prisma.review.create({
      data: {
        hallId: booking.hallId,
        customerId: session.userId,
        bookingId: booking.id,
        rating: numRating,
        title: title?.trim() || null,
        content: trimmedContent,
        status: 'APPROVED',
      },
    });

    // Recalculate venue rating stats
    const allApprovedReviews = await prisma.review.findMany({
      where: { hallId: booking.hallId, status: 'APPROVED' },
      select: { rating: true },
    });
    const reviewCount = allApprovedReviews.length;
    const averageRating =
      reviewCount > 0
        ? Number((allApprovedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : numRating;

    await createAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: 'REVIEW_CREATED',
      entityType: 'REVIEW',
      entityId: review.id,
      details: { hallId: booking.hallId, rating: numRating, averageRating, reviewCount },
    });

    return NextResponse.json({
      success: true,
      review,
      averageRating,
      reviewCount,
    });
  } catch (error: any) {
    // Handle Prisma unique constraint violation code P2002 if concurrent submissions occur
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already submitted a review for this booking.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}
