import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createBookingWithLock } from '@/lib/services/bookingService';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to proceed with venue booking.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      hallId,
      occasionId,
      eventDate,
      startTime,
      endTime,
      guestCount,
      cateringType = 'NONE',
      selectedAddonIds = [],
    } = body;

    if (!hallId || !occasionId || !eventDate || !startTime || !endTime || !guestCount) {
      return NextResponse.json(
        { error: 'Missing required booking parameters: venue, occasion, date, time range, and guest count are required.' },
        { status: 400 }
      );
    }

    // Attempt booking with atomic transaction and concurrency locking
    const booking = await createBookingWithLock({
      hallId,
      customerId: session.userId,
      occasionId,
      eventDate,
      startTime,
      endTime,
      guestCount: parseInt(guestCount, 10),
      cateringType,
      selectedAddonIds,
    });

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error: any) {
    console.error('Booking creation error:', error);
    // Return 409 Conflict if slot is unavailable
    if (error.message?.includes('already reserved') || error.message?.includes('blocked')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create booking' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    if (session.role === 'CUSTOMER') {
      where.customerId = session.userId;
    } else if (session.role === 'MANAGER') {
      // Find manager profile
      const managerProfile = await prisma.managerProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!managerProfile) {
        return NextResponse.json({ bookings: [] });
      }
      where.hall = { managerId: managerProfile.id };
    } else if (session.role === 'ADMIN') {
      // Admin sees all, optionally filtered
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        hall: {
          include: {
            city: true,
            locality: true,
            media: { where: { isCover: true } },
          },
        },
        occasion: true,
        customer: {
          select: { fullName: true, email: true, phone: true },
        },
        payments: true,
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch bookings' }, { status: 500 });
  }
}
