import prisma from '../prisma';

export function isTimeIntervalOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  // Convert HH:mm to minutes from midnight for robust numerical comparison
  const [hA1, mA1] = startA.split(':').map(Number);
  const [hA2, mA2] = endA.split(':').map(Number);
  const [hB1, mB1] = startB.split(':').map(Number);
  const [hB2, mB2] = endB.split(':').map(Number);

  const aStart = hA1 * 60 + mA1;
  const aEnd = hA2 * 60 + mA2;
  const bStart = hB1 * 60 + mB1;
  const bEnd = hB2 * 60 + mB2;

  // [start, end) interval conflict condition:
  return aStart < bEnd && aEnd > bStart;
}

export interface CheckAvailabilityParams {
  hallId: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  excludeBookingId?: string; // e.g. when updating a booking
}

export interface AvailabilityResult {
  isAvailable: boolean;
  conflictReason?: string;
  conflictingBooking?: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    isExternal: boolean;
  };
}

export async function checkHallAvailability(
  params: CheckAvailabilityParams
): Promise<AvailabilityResult> {
  const { hallId, eventDate, startTime, endTime, excludeBookingId } = params;

  // 1. Check Manager Availability Blocks (blackouts)
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      hallId,
      startDate: { lte: eventDate },
      endDate: { gte: eventDate },
    },
  });

  for (const block of blocks) {
    if (isTimeIntervalOverlapping(startTime, endTime, block.startTime, block.endTime)) {
      return {
        isAvailable: false,
        conflictReason: `Hall is blocked by management for: ${block.reason}`,
      };
    }
  }

  // 2. Query bookings on the same date for this hall
  const now = new Date();
  const existingBookings = await prisma.booking.findMany({
    where: {
      hallId,
      eventDate,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      OR: [
        { status: 'CONFIRMED' },
        {
          status: 'PAYMENT_PENDING',
          holdExpiresAt: { gt: now },
        },
      ],
    },
  });

  for (const booking of existingBookings) {
    if (isTimeIntervalOverlapping(startTime, endTime, booking.startTime, booking.endTime)) {
      return {
        isAvailable: false,
        conflictReason: booking.isExternal
          ? 'Hall is reserved for an external event during this time slot.'
          : 'Hall is already booked or currently held for another customer.',
        conflictingBooking: {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          isExternal: booking.isExternal,
        },
      };
    }
  }

  return { isAvailable: true };
}

export async function getHallBookingsForDate(hallId: string, eventDate: string) {
  const now = new Date();
  return prisma.booking.findMany({
    where: {
      hallId,
      eventDate,
      OR: [
        { status: 'CONFIRMED' },
        {
          status: 'PAYMENT_PENDING',
          holdExpiresAt: { gt: now },
        },
      ],
    },
    select: {
      id: stringOrAny(),
      startTime: true,
      endTime: true,
      status: true,
      isExternal: true,
    },
    orderBy: { startTime: 'asc' },
  });
}

function stringOrAny() {
  return true;
}
