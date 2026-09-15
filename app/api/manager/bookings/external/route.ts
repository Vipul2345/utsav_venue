import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createExternalBooking } from '@/lib/services/bookingService';
import { createAuditLog } from '@/lib/services/auditService';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
    }

    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!managerProfile) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      hallId,
      occasionId,
      eventDate,
      startTime,
      endTime,
      guestCount,
      customerName,
      customerPhone,
      totalAmount,
    } = body;

    if (!hallId || !eventDate || !startTime || !endTime || !customerName) {
      return NextResponse.json(
        { error: 'Venue, event date, start/end time, and client name are required.' },
        { status: 400 }
      );
    }

    const booking = await createExternalBooking({
      hallId,
      managerId: managerProfile.id,
      occasionId,
      eventDate,
      startTime,
      endTime,
      guestCount: parseInt(guestCount || '100', 10),
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || '',
      totalAmount: parseFloat(totalAmount || '0'),
    });

    await createAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: 'EXTERNAL_BOOKING_CREATED',
      entityType: 'BOOKING',
      entityId: booking.id,
      details: {
        bookingNumber: booking.bookingNumber,
        hallId,
        eventDate,
        customerName,
      },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('External booking error:', error);
    if (error.message?.includes('overlaps')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create external booking' }, { status: 400 });
  }
}
