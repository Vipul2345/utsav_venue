import prisma from '../prisma';
import { isTimeIntervalOverlapping } from './availabilityService';
import { calculateHallPrice } from './pricingService';
import { createAuditLog } from './auditService';
import { createNotification } from './notificationService';
import { CateringType } from '../types';
import { sendBookingConfirmationEmail } from '../email';

export interface CreateBookingInput {
  hallId: string;
  customerId: string;
  occasionId: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  guestCount: number;
  cateringType: CateringType;
  selectedAddonIds?: string[];
}

export interface CreateExternalBookingInput {
  hallId: string;
  managerId: string;
  occasionId?: string;
  eventDate: string;
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
    startTime,
    endTime,
    guestCount,
    cateringType,
    selectedAddonIds = [],
  } = input;

  // Validate basic time consistency
  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);
  if (h2 * 60 + m2 <= h1 * 60 + m1) {
    throw new Error('End time must be later than start time');
  }

  // Validate date is not in past
  const todayStr = new Date().toISOString().split('T')[0];
  if (eventDate < todayStr) {
    throw new Error('Booking date cannot be in the past');
  }

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
        startDate: { lte: eventDate },
        endDate: { gte: eventDate },
      },
    });

    for (const block of blocks) {
      if (isTimeIntervalOverlapping(startTime, endTime, block.startTime, block.endTime)) {
        throw new Error(`Venue is blocked by management for: ${block.reason}`);
      }
    }

    // 3. Concurrency Check: Overlapping Bookings (Confirmed or Active Payment Hold)
    const now = new Date();
    const existingBookings = await tx.booking.findMany({
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
    });

    for (const eb of existingBookings) {
      if (isTimeIntervalOverlapping(startTime, endTime, eb.startTime, eb.endTime)) {
        throw new Error('This time slot is already reserved or held by another customer.');
      }
    }

    // 4. Calculate Authoritative Server-Side Pricing
    const pricing = await calculateHallPrice({
      hallId,
      eventDate,
      startTime,
      endTime,
      guestCount,
      cateringType,
      selectedAddonIds,
    });

    // 5. Generate Booking Number
    const bookingCount = await tx.booking.count();
    const bookingNumber = `BK-${new Date().getFullYear()}-${String(bookingCount + 1).padStart(5, '0')}`;

    // 6. Set temporary payment hold expiration
    const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000);

    // 7. Create the booking in PAYMENT_PENDING state
    const booking = await tx.booking.create({
      data: {
        bookingNumber,
        hallId,
        customerId,
        occasionId,
        eventDate,
        startTime,
        endTime,
        guestCount,
        cateringType,
        status: 'PAYMENT_PENDING',
        holdExpiresAt,
        baseRentalAmount: pricing.baseRental + pricing.weekendSurcharge,
        cateringAmount: pricing.cateringTotal,
        addonsAmount: pricing.addonsTotal,
        taxesAmount: pricing.taxesAmount,
        discountAmount: 0,
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
    startTime,
    endTime,
    guestCount,
    customerName,
    customerPhone,
    totalAmount = 0,
  } = input;

  return prisma.$transaction(async (tx) => {
    // Verify manager owns this hall
    const hall = await tx.hall.findFirst({
      where: { id: hallId, managerId },
    });

    if (!hall) {
      throw new Error('Venue not found or unauthorized');
    }

    // Check availability
    const now = new Date();
    const existing = await tx.booking.findMany({
      where: {
        hallId,
        eventDate,
        OR: [
          { status: 'CONFIRMED' },
          { status: 'PAYMENT_PENDING', holdExpiresAt: { gt: now } },
        ],
      },
    });

    for (const eb of existing) {
      if (isTimeIntervalOverlapping(startTime, endTime, eb.startTime, eb.endTime)) {
        throw new Error('This time slot overlaps with an existing booking.');
      }
    }

    const bookingCount = await tx.booking.count();
    const bookingNumber = `EXT-${new Date().getFullYear()}-${String(bookingCount + 1).padStart(5, '0')}`;

    const booking = await tx.booking.create({
      data: {
        bookingNumber,
        hallId,
        customerId: null,
        isExternal: true,
        externalCustomerName: customerName,
        externalCustomerPhone: customerPhone,
        occasionId: occasionId || null,
        eventDate,
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

    return booking;
  });
}

export async function confirmBookingPayment(params: {
  bookingId: string;
  providerTransactionId: string;
  providerSignature?: string;
  amount: number;
}) {
  const { bookingId, providerTransactionId, providerSignature, amount } = params;

  return prisma.$transaction(async (tx) => {
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
      return booking; // Idempotent
    }

    if (booking.status !== 'PAYMENT_PENDING') {
      throw new Error(`Cannot confirm payment for booking with status ${booking.status}`);
    }

    // Verify hold has not expired
    if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
      // Slot hold expired! Check if slot is still unbooked by anyone else
      const conflict = await tx.booking.findFirst({
        where: {
          hallId: booking.hallId,
          eventDate: booking.eventDate,
          id: { not: booking.id },
          status: 'CONFIRMED',
        },
      });

      if (conflict && isTimeIntervalOverlapping(booking.startTime, booking.endTime, conflict.startTime, conflict.endTime)) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'HOLD_EXPIRED' },
        });
        throw new Error('The temporary hold on this slot expired and it was booked by another customer.');
      }
    }

    // Generate payment record
    const paymentNumber = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        paymentNumber,
        amount,
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
    if (booking.customerId) {
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Booking Confirmed!',
          message: `Your booking ${booking.bookingNumber} for ${booking.hall.name} on ${booking.eventDate} is confirmed.`,
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
          message: `Booking ${booking.bookingNumber} confirmed for ${booking.hall.name} on ${booking.eventDate} (${booking.startTime} - ${booking.endTime}).`,
          type: 'BOOKING',
          link: `/manager/bookings`,
        },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        actorId: booking.customerId || 'SYSTEM',
        actorRole: 'CUSTOMER',
        action: 'BOOKING_PAYMENT_CONFIRMED',
        entityType: 'BOOKING',
        entityId: booking.id,
        details: JSON.stringify({
          bookingNumber: booking.bookingNumber,
          amount,
          providerTransactionId,
        }),
      },
    });

    // Send confirmation email asynchronously via Resend
    if (booking.customer?.email) {
      sendBookingConfirmationEmail({
        to: booking.customer.email,
        customerName: booking.customer.fullName,
        bookingNumber: booking.bookingNumber,
        hallName: booking.hall.name,
        eventDate: booking.eventDate,
        timeSlot: `${booking.startTime} - ${booking.endTime}`,
        guestCount: booking.guestCount,
        totalAmount: Number(booking.totalAmount),
      }).catch((err) => {
        console.error('[BOOKING] Error sending confirmation email:', err);
      });
    }

    return updated;
  });
}
