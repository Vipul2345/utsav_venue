import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createExternalBooking } from '@/lib/services/bookingService';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only MANAGER or ADMIN
    if (session.role !== 'MANAGER' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only venue managers and admins can record offline bookings' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      hallId,
      occasionId,
      eventDate,
      startDate,
      endDate,
      startTime = '09:00',
      endTime = '23:00',
      guestCount = 100,
      customerName,
      customerPhone,
      totalAmount = 0,
      notes,
    } = body;

    if (!hallId) {
      return NextResponse.json({ error: 'hallId is required' }, { status: 400 });
    }

    if (!customerName || !String(customerName).trim()) {
      return NextResponse.json({ error: 'Walk-in / offline client name is required' }, { status: 400 });
    }

    if (!customerPhone || !String(customerPhone).trim()) {
      return NextResponse.json({ error: 'Walk-in / offline client phone is required' }, { status: 400 });
    }

    const reqStart = startDate || eventDate || '';
    const reqEnd = endDate || reqStart;

    if (!reqStart) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }

    // Verify hall exists and manager owns it (or Admin)
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: { manager: true },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const isOwnerManager = session.role === 'MANAGER' && hall.manager.userId === session.userId;
    const isAdmin = session.role === 'ADMIN';

    if (!isOwnerManager && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You do not have management permissions for this venue' }, { status: 403 });
    }

    const booking = await createExternalBooking({
      hallId,
      managerId: hall.managerId,
      occasionId,
      eventDate: reqStart,
      startDate: reqStart,
      endDate: reqEnd,
      startTime,
      endTime,
      guestCount: Number(guestCount),
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      totalAmount: Number(totalAmount) || 0,
      notes: notes ? String(notes).trim() : 'Manual offline booking recorded',
    });

    return NextResponse.json({
      success: true,
      message: 'Offline booking confirmed and calendar slot locked against online bookings.',
      booking,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Offline booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record offline booking' },
      { status: 400 }
    );
  }
}
