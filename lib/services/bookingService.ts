import prisma from '../prisma';
import { isTimeIntervalOverlapping, isDateRangeOverlapping } from './availabilityService';
import { calculateHallPrice } from './pricingService';
import { createAuditLog } from './auditService';
import { createNotification } from './notificationService';
import { CateringType } from '../types';
import { sendBookingConfirmationEmail } from '../email';

export interface CreateBookingInput {
  hallId: string;
  customerId: string;
  occasionId: string;
  eventDate?: string; // YYYY-MM-DD (legacy / fallback)
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  guestCount: number;
  cateringType: CateringType;
  selectedAddonIds?: string[];
  packageId?: string;
}

export interface CreateExternalBookingInput {
  hallId: string;
  managerId: string;
  occasionId?: string;
  eventDate?: string;
  startDate?: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  customerName: string;
  customerPhone: string;
  totalAmount?: number;
  notes?: string;
}

const HOLD_DURATION_MINUTES = parseInt(process.env.HOLD_DURATION_MINUTES || '10', 10);

export async function createBookingWithLock(input: CreateBookingInput) {
  const {
    hallId,
    customerId,
    occasionId,
    eventDate,
    startDate,
    endDate,
    startTime,
    endTime,
    guestCount,
    cateringType,
    selectedAddonIds = [],
    packageId,
  } = input;

  const reqStart = startDate || eventDate || '';
  const reqEnd = endDate || reqStart;

  if (!reqStart) {
    throw new Error('Start date or event date is required');
  }

  // Validate basic time consistency
  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);
  if (h2 * 60 + m2 <= h1 * 60 + m1) {
    throw new Error('End time must be later than start time');
  }

  // Validate dates
  const todayStr = new Date().toISOString().split('T')[0];
  if (reqStart < todayStr) {
    throw new Error('Booking start date cannot be in the past');
  }
  if (reqEnd < reqStart) {
    throw new Error('Booking end date cannot be earlier than start date');
  }

  const startMs = new Date(`${reqStart}T00:00:00Z`).getTime();
  const endMs = new Date(`${reqEnd}T00:00:00Z`).getTime();
  const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
  const numberOfDays = Math.max(1, diffDays + 1);

  return prisma.$transaction(async (tx) => {
    // 0. Acquire pessimistic row-level write lock on the venue row to strictly serialize concurrent booking attempts at DB level
    await tx.$executeRaw`SELECT id FROM "Hall" WHERE id = ${hallId} FOR UPDATE;`;

    // 1. Fetch Hall & verify status and capacity
    const hall = await tx.hall.findUnique({
      where: { id: hallId },
      include: {
        manager: true,
        pricingRule: true,
        addons: true,
        occasions: {
          where: { occasionId, status: 'APPROVED' },
        },
      },
    });

    if (!hall) {
      throw new Error('Venue not found');
    }

    if (hall.status !== 'APPROVED') {
      throw new Error('This venue is not currently accepting public bookings');
    }

    if (hall.occasions.length === 0) {
      throw new Error('This venue does not have admin approval for the selected occasion');
    }

    if (guestCount < hall.minCapacity) {
      throw new Error(`Guest count must be at least ${hall.minCapacity} for this venue`);
    }

    if (guestCount > hall.maxCapacity) {
      throw new Error(`Guest count exceeds venue maximum capacity of ${hall.maxCapacity}`);
    }

    // Verify customer is email-verified
    const customer = await tx.user.findUnique({
      where: { id: customerId },
    });
    if (customer && customer.role === 'CUSTOMER' && !customer.isEmailVerified) {
      throw new Error('Please verify your email address with OTP before placing a booking.');
    }

    // 2. Concurrency Check: Availability Blocks (blackout)
    const blocks = await tx.availabilityBlock.findMany({
      where: {
        hallId,
        startDate: { lte: reqEnd },
        endDate: { gte: reqStart },
      },
    });

    for (const block of blocks) {
      if (isDateRangeOverlapping(block.startDate, block.endDate, reqStart, reqEnd)) {
        if (reqStart !== reqEnd || block.startDate !== block.endDate) {
          throw new Error(`Venue is blocked by management for: ${block.reason}`);
        }
        if (isTimeIntervalOverlapping(startTime, endTime, block.startTime, block.endTime)) {
          throw new Error(`Venue is blocked by management for: ${block.reason}`);
        }
      }
    }

    // 3. Concurrency Check: Overlapping Bookings across entire range (Confirmed or Active Payment Hold)
    const now = new Date();
    const existingBookings = await tx.booking.findMany({
      where: {
        hallId,
        OR: [
          { status: 'CONFIRMED' },
          {
            status: 'PAYMENT_PENDING',
            holdExpiresAt: { gt: now },
          },
        ],
        AND: [
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

    for (const eb of existingBookings) {
      const ebStart = eb.startDate || eb.eventDate;
      const ebEnd = eb.endDate || ebStart;

      if (isDateRangeOverlapping(ebStart, ebEnd, reqStart, reqEnd)) {
        if (reqStart === reqEnd && ebStart === ebEnd) {
          if (isTimeIntervalOverlapping(startTime, endTime, eb.startTime, eb.endTime)) {
            throw new Error('This time slot is already reserved or held by another customer.');
          }
        } else {
          throw new Error('The selected date range overlaps with an existing booking or active hold.');
        }
      }
    }

    // 4. Calculate Authoritative Server-Side Pricing
    const pricing = await calculateHallPrice({
      hallId,
      eventDate: reqStart,
      startDate: reqStart,
      endDate: reqEnd,
      startTime,
      endTime,
      guestCount,
      cateringType,
      selectedAddonIds,
      packageId,
    });

    // 5. Generate Booking Number
    const bookingCount = await tx.booking.count();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingNumber = `BK-${new Date().getFullYear()}-${String(bookingCount + 1).padStart(5, '0')}-${randomHex}`;

    // 6. Set temporary payment hold expiration
    const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000);

    // 7. Create the booking in PAYMENT_PENDING state
    const booking = await tx.booking.create({
      data: {
        bookingNumber,
        hallId,
        customerId,
        occasionId,
        packageId: pricing.packageId || null,
        packageName: pricing.packageName || null,
        packagePrice: pricing.packagePrice || 0,
        bulkDiscountTier: pricing.bulkDiscountTier || null,
        bulkDiscountAmount: pricing.bulkDiscountAmount || 0,
        eventDate: reqStart,
        startDate: reqStart,
        endDate: reqEnd,
        numberOfDays,
        startTime,
        endTime,
        guestCount,
        cateringType,
        status: 'PAYMENT_PENDING',
        bookingType: 'ONLINE',
        holdExpiresAt,
        baseRentalAmount: pricing.baseRental + pricing.weekendSurcharge,
        cateringAmount: pricing.cateringTotal,
        addonsAmount: pricing.addonsTotal,
        taxesAmount: pricing.taxesAmount,
        discountAmount: pricing.bulkDiscountAmount || 0,
        totalAmount: pricing.totalAmount,
        platformCommissionPercent: pricing.platformCommissionPercent,
        platformCommissionAmount: pricing.platformCommissionAmount,
        managerPayoutAmount: pricing.managerPayoutAmount,
        items: {
          create: pricing.addonsList.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
          })),
        },
      },
      include: {
        hall: true,
        items: true,
        package: true,
      },
    });

    return booking;
  });
}

export async function createExternalBooking(input: CreateExternalBookingInput) {
  const {
    hallId,
    managerId,
    occasionId,
    eventDate,
    startDate,
    endDate,
    startTime,
    endTime,
    guestCount,
    customerName,
    customerPhone,
    totalAmount = 0,
  } = input;

  const reqStart = startDate || eventDate || '';
  const reqEnd = endDate || reqStart;

  const startMs = new Date(`${reqStart}T00:00:00Z`).getTime();
  const endMs = new Date(`${reqEnd}T00:00:00Z`).getTime();
  const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
  const numberOfDays = Math.max(1, diffDays + 1);

  return prisma.$transaction(async (tx) => {
    // 0. Acquire pessimistic row-level write lock on the venue row to strictly serialize concurrent online & offline bookings
    await tx.$executeRaw`SELECT id FROM "Hall" WHERE id = ${hallId} FOR UPDATE;`;

    // Verify manager owns this hall (or admin override)
    const hall = await tx.hall.findFirst({
      where: { id: hallId },
    });

    if (!hall) {
      throw new Error('Venue not found');
    }

    if (hall.managerId !== managerId && managerId !== 'ADMIN') {
      // Check if managerId belongs to an admin user
      const adminUser = await tx.user.findFirst({
        where: { id: managerId, role: 'ADMIN' },
      });
      if (!adminUser) {
        throw new Error('Venue not found or unauthorized');
      }
    }

    // Check blackout blocks
    const blocks = await tx.availabilityBlock.findMany({
      where: {
        hallId,
        startDate: { lte: reqEnd },
        endDate: { gte: reqStart },
      },
    });

    for (const block of blocks) {
      if (isDateRangeOverlapping(block.startDate, block.endDate, reqStart, reqEnd)) {
        if (reqStart !== reqEnd || block.startDate !== block.endDate) {
          throw new Error(`Venue is blocked by management for: ${block.reason}`);
        }
        if (isTimeIntervalOverlapping(startTime, endTime, block.startTime, block.endTime)) {
          throw new Error(`Venue is blocked by management for: ${block.reason}`);
        }
      }
    }

    // Check availability across range
    const now = new Date();
    const existing = await tx.booking.findMany({
      where: {
        hallId,
        OR: [
          { status: 'CONFIRMED' },
          { status: 'PAYMENT_PENDING', holdExpiresAt: { gt: now } },
        ],
        AND: [
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

    for (const eb of existing) {
      const ebStart = eb.startDate || eb.eventDate;
      const ebEnd = eb.endDate || ebStart;
      if (isDateRangeOverlapping(ebStart, ebEnd, reqStart, reqEnd)) {
        if (reqStart === reqEnd && ebStart === ebEnd) {
          if (isTimeIntervalOverlapping(startTime, endTime, eb.startTime, eb.endTime)) {
            throw new Error('This time slot overlaps with an existing booking.');
          }
        } else {
          throw new Error('The selected date range overlaps with an existing booking or active hold.');
        }
      }
    }

    const bookingCount = await tx.booking.count();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingNumber = `EXT-${new Date().getFullYear()}-${String(bookingCount + 1).padStart(5, '0')}-${randomHex}`;

    const booking = await tx.booking.create({
      data: {
        bookingNumber,
        hallId,
        customerId: null,
        isExternal: true,
        bookingType: 'OFFLINE_MANUAL',
        createdById: managerId,
        internalNotes: input.notes || 'Offline booking recorded via staff portal',
        externalCustomerName: customerName,
        externalCustomerPhone: customerPhone,
        occasionId: occasionId || null,
        eventDate: reqStart,
        startDate: reqStart,
        endDate: reqEnd,
        numberOfDays,
        startTime,
        endTime,
        guestCount,
        cateringType: 'NONE',
        status: 'CONFIRMED',
        holdExpiresAt: null,
        totalAmount,
        baseRentalAmount: totalAmount,
        platformCommissionPercent: 0,
        platformCommissionAmount: 0,
        managerPayoutAmount: totalAmount,
      },
    });

    let resolvedActorId: string | null = null;
    if (managerId) {
      const mgr = await tx.managerProfile.findUnique({
        where: { id: managerId },
        select: { userId: true },
      });
      const targetUserId = mgr?.userId || managerId;
      const userExists = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      });
      if (userExists) {
        resolvedActorId = userExists.id;
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: resolvedActorId,
        actorRole: 'MANAGER',
        action: 'OFFLINE_BOOKING_CREATED',
        entityType: 'BOOKING',
        entityId: booking.id,
        details: JSON.stringify({
          bookingNumber,
          hallId,
          customerName,
          customerPhone,
          dates: `${reqStart} to ${reqEnd}`,
          totalAmount,
        }),
      },
    });

    return booking;
  });
}

export async function confirmBookingPayment(params: {
  bookingId: string;
  providerTransactionId: string;
  providerSignature?: string;
  amount?: number;
  waitForEmail?: boolean;
}) {
  const { bookingId, providerTransactionId, providerSignature, amount, waitForEmail = false } = params;

  let emailDeliveryPromise: Promise<any> | null = null;

  const result = await prisma.$transaction(async (tx) => {
    // Row-level lock ensures strict serialization for concurrent confirmation calls
    await tx.$executeRaw`SELECT id FROM "Booking" WHERE id = ${bookingId} FOR UPDATE;`;

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        hall: {
          include: { manager: { include: { user: true } } },
        },
        customer: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CONFIRMED') {
      return booking; // Idempotent: already confirmed, do not create duplicate payments or duplicate emails
    }

    if (booking.status !== 'PAYMENT_PENDING') {
      throw new Error(`Cannot confirm payment for booking with status ${booking.status}`);
    }

    // Verify hold has not expired
    if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
      const bStart = booking.startDate || booking.eventDate;
      const bEnd = booking.endDate || bStart;

      const conflicts = await tx.booking.findMany({
        where: {
          hallId: booking.hallId,
          id: { not: booking.id },
          status: 'CONFIRMED',
          AND: [
            {
              OR: [
                {
                  startDate: { lte: bEnd },
                  endDate: { gte: bStart },
                },
                {
                  startDate: null,
                  eventDate: { lte: bEnd, gte: bStart },
                },
              ],
            },
          ],
        },
      });

      for (const conflict of conflicts) {
        const cStart = conflict.startDate || conflict.eventDate;
        const cEnd = conflict.endDate || cStart;
        if (isDateRangeOverlapping(bStart, bEnd, cStart, cEnd)) {
          if (bStart === bEnd && cStart === cEnd) {
            if (isTimeIntervalOverlapping(booking.startTime, booking.endTime, conflict.startTime, conflict.endTime)) {
              await tx.booking.update({
                where: { id: booking.id },
                data: { status: 'HOLD_EXPIRED' },
              });
              throw new Error('The temporary hold on this slot expired and it was booked by another customer.');
            }
          } else {
            await tx.booking.update({
              where: { id: booking.id },
              data: { status: 'HOLD_EXPIRED' },
            });
            throw new Error('The temporary hold on this slot expired and it was booked by another customer.');
          }
        }
      }
    }

    // Generate payment record using authoritative server amount
    const paymentNumber = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        paymentNumber,
        amount: booking.totalAmount,
        currency: 'INR',
        status: 'SUCCESS',
        provider: 'MOCK_GATEWAY',
        providerTransactionId,
        providerSignature,
        paidAt: new Date(),
      },
    });

    // Update booking to CONFIRMED
    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CONFIRMED',
        holdExpiresAt: null,
      },
    });

    // Notifications
    const dateLabel =
      booking.startDate && booking.endDate && booking.startDate !== booking.endDate
        ? `${booking.startDate} to ${booking.endDate} (${booking.numberOfDays} days)`
        : booking.eventDate;

    if (booking.customerId) {
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Booking Confirmed!',
          message: `Your booking ${booking.bookingNumber} for ${booking.hall.name} on ${dateLabel} is confirmed.`,
          type: 'BOOKING',
          link: `/bookings/${booking.id}`,
        },
      });
    }

    if (booking.hall.manager?.user?.id) {
      await tx.notification.create({
        data: {
          userId: booking.hall.manager.user.id,
          title: 'New Confirmed Booking',
          message: `Booking ${booking.bookingNumber} confirmed for ${booking.hall.name} on ${dateLabel} (${booking.startTime} - ${booking.endTime}).`,
          type: 'BOOKING',
          link: `/manager/bookings`,
        },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        actorId: booking.customerId || null,
        actorRole: 'CUSTOMER',
        action: 'BOOKING_PAYMENT_CONFIRMED',
        entityType: 'BOOKING',
        entityId: booking.id,
        details: JSON.stringify({
          bookingNumber: booking.bookingNumber,
          amount: amount || booking.totalAmount,
          providerTransactionId,
        }),
      },
    });

    // Send confirmation email asynchronously via Resend (non-blocking side effect)
    if (booking.customer?.email) {
      emailDeliveryPromise = sendBookingConfirmationEmail({
        to: booking.customer.email,
        customerName: booking.customer.fullName,
        bookingNumber: booking.bookingNumber,
        hallName: booking.hall.name,
        eventDate: booking.eventDate,
        timeSlot: `${booking.startTime} - ${booking.endTime}`,
        guestCount: booking.guestCount,
        totalAmount: Number(booking.totalAmount),
      });

      emailDeliveryPromise
        .then((res) => {
          if (!res.success) {
            console.error(
              `[BOOKING-EMAIL-FAILURE] Confirmation email delivery failed for ${booking.bookingNumber} to ${booking.customer?.email}:`,
              res.error
            );
          } else {
            console.log(
              `[BOOKING-EMAIL-SUCCESS] Confirmation email delivered for ${booking.bookingNumber} (ID: ${res.messageId || 'simulated'})`
            );
          }
        })
        .catch((err) => {
          console.error(`[BOOKING-EMAIL-ERROR] Unexpected error dispatching confirmation email for ${booking.bookingNumber}:`, err);
        });
    }

    return updated;
  });

  if (waitForEmail && emailDeliveryPromise) {
    try {
      await emailDeliveryPromise;
    } catch {
      // Non-blocking: email failure never rolls back the confirmed booking
    }
  }

  (result as any).emailDeliveryPromise = emailDeliveryPromise;
  return result;
}
