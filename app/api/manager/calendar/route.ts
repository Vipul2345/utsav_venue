import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const hallId = searchParams.get('hallId');

    const hallFilter = hallId ? { id: hallId, managerId: managerProfile.id } : { managerId: managerProfile.id };

    const halls = await prisma.hall.findMany({
      where: hallFilter,
      select: { id: true, name: true },
    });

    const hallIds = halls.map((h) => h.id);

    const now = new Date();
    // 1. Fetch bookings
    const bookings = await prisma.booking.findMany({
      where: {
        hallId: { in: hallIds },
        OR: [
          { status: 'CONFIRMED' },
          { status: 'COMPLETED' },
          { status: 'PAYMENT_PENDING', holdExpiresAt: { gt: now } },
        ],
      },
      include: {
        hall: { select: { name: true } },
        occasion: { select: { name: true } },
        customer: { select: { fullName: true, phone: true } },
      },
    });

    // 2. Fetch blackout blocks
    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        hallId: { in: hallIds },
      },
      include: {
        hall: { select: { name: true } },
      },
    });

    const events = [
      ...bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        hallId: b.hallId,
        hallName: b.hall.name,
        date: b.eventDate,
        startTime: b.startTime,
        endTime: b.endTime,
        title: `${b.hall.name} - ${b.occasion?.name || 'Event'} (${b.isExternal ? 'External' : b.customer?.fullName || 'Guest'})`,
        clientName: b.isExternal ? b.externalCustomerName : b.customer?.fullName,
        clientPhone: b.isExternal ? b.externalCustomerPhone : b.customer?.phone,
        guestCount: b.guestCount,
        totalAmount: b.totalAmount,
        status: b.status,
        isExternal: b.isExternal,
        type: b.isExternal ? 'EXTERNAL_BOOKING' : 'ONLINE_BOOKING',
      })),
      ...blocks.map((bl) => ({
        id: bl.id,
        hallId: bl.hallId,
        hallName: bl.hall.name,
        date: bl.startDate,
        endDate: bl.endDate,
        startTime: bl.startTime,
        endTime: bl.endTime,
        title: `BLOCKED: ${bl.reason} (${bl.hall.name})`,
        reason: bl.reason,
        status: 'BLOCKED',
        type: 'MAINTENANCE_BLOCK',
      })),
    ];

    return NextResponse.json({ events, halls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch calendar events' }, { status: 500 });
  }
}
