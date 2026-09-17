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

export function isDateRangeOverlapping(
  startA: string, // YYYY-MM-DD
  endA: string,   // YYYY-MM-DD
  startB: string, // YYYY-MM-DD
  endB: string    // YYYY-MM-DD
): boolean {
  // Two inclusive date ranges [startA, endA] and [startB, endB] overlap if and only if:
  // startA <= endB AND endA >= startB
  return startA <= endB && endA >= startB;
}

export interface CheckAvailabilityParams {
  hallId: string;
  eventDate?: string; // YYYY-MM-DD (legacy / single date)
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
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
  const { hallId, startTime, endTime, excludeBookingId } = params;
  const reqStart = params.startDate || params.eventDate || '';
  const reqEnd = params.endDate || reqStart;

  if (!reqStart) {
    throw new Error('Start date or event date is required');
  }

  // 1. Check Manager Availability Blocks (blackouts) across the date range
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      hallId,
      startDate: { lte: reqEnd },
      endDate: { gte: reqStart },
    },
  });

  for (const block of blocks) {
    if (isDateRangeOverlapping(block.startDate, block.endDate, reqStart, reqEnd)) {
      // If multi-day or single-day time overlaps
      if (reqStart !== reqEnd || block.startDate !== block.endDate) {
        return {
          isAvailable: false,
          conflictReason: `Hall is blocked by management for: ${block.reason}`,
        };
      }
      if (isTimeIntervalOverlapping(startTime, endTime, block.startTime, block.endTime)) {
        return {
          isAvailable: false,
          conflictReason: `Hall is blocked by management for: ${block.reason}`,
        };
      }
    }
  }

  // 2. Query bookings across the date range for this hall
  const now = new Date();
  const existingBookings = await prisma.booking.findMany({
    where: {
      hallId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      AND: [
        {
          OR: [
            { status: 'CONFIRMED' },
            {
              status: 'PAYMENT_PENDING',
              holdExpiresAt: { gt: now },
            },
          ],
        },
        {
          OR: [
            {
              startDate: { lte: reqEnd },
              endDate: { gte: reqStart },
            },
            {
              startDate: null,
              eventDate: { lte: reqEnd, gte: reqStart },
            },
          ],
        },
      ],
    },
  });

  for (const booking of existingBookings) {
    const ebStart = booking.startDate || booking.eventDate;
    const ebEnd = booking.endDate || ebStart;

    if (isDateRangeOverlapping(ebStart, ebEnd, reqStart, reqEnd)) {
      // If both bookings are single-day on the exact same date, check time interval
      if (reqStart === reqEnd && ebStart === ebEnd) {
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
      } else {
        // Multi-day booking completely reserves the venue across the overlapping days
        return {
          isAvailable: false,
          conflictReason: booking.isExternal
            ? 'Hall is reserved for an external event during the requested date range.'
            : 'Hall is already booked or currently held for another customer during the requested date range.',
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
