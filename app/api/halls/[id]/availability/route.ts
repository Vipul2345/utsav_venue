import { NextResponse } from 'next/server';
import { checkHallAvailability } from '@/lib/services/availabilityService';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!date) {
      return NextResponse.json({ error: 'Date (YYYY-MM-DD) is required' }, { status: 400 });
    }

    // Resolve slug or ID
    const hall = await prisma.hall.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    if (startTime && endTime) {
      const result = await checkHallAvailability({
        hallId: hall.id,
        eventDate: date,
        startTime,
        endTime,
      });
      return NextResponse.json(result);
    }

    // Otherwise return all booked and blocked intervals for this date
    const now = new Date();
    const bookings = await prisma.booking.findMany({
      where: {
        hallId: hall.id,
        eventDate: date,
        OR: [
          { status: 'CONFIRMED' },
          { status: 'PAYMENT_PENDING', holdExpiresAt: { gt: now } },
        ],
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        isExternal: true,
      },
    });

    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        hallId: hall.id,
        startDate: { lte: date },
        endDate: { gte: date },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        reason: true,
      },
    });

    return NextResponse.json({
      date,
      bookedSlots: bookings.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
        type: b.isExternal ? 'EXTERNAL' : 'ONLINE_BOOKING',
      })),
      blockedSlots: blocks.map((bl) => ({
        startTime: bl.startTime,
        endTime: bl.endTime,
        reason: bl.reason,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Availability check failed' }, { status: 500 });
  }
}
