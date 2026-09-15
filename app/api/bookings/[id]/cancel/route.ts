import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/auditService';
import { createNotification } from '@/lib/services/notificationService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason = 'Cancelled by user' } = body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        hall: {
          include: {
            manager: { include: { user: true } },
          },
        },
        payments: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Permission check
    const isCustomerOwner = session.role === 'CUSTOMER' && booking.customerId === session.userId;
    const isManagerOwner =
      session.role === 'MANAGER' && booking.hall.managerId === session.managerProfileId;
    const isAdmin = session.role === 'ADMIN';

    if (!isCustomerOwner && !isManagerOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return NextResponse.json({ error: 'Booking is already cancelled.' }, { status: 400 });
    }

    // Calculate refund based on hall policy
    let refundAmount = 0;
    const successfulPayment = booking.payments.find((p) => p.status === 'SUCCESS');
    const paidAmount = successfulPayment ? successfulPayment.amount : 0;

    if (paidAmount > 0) {
      // Calculate hours until event
      const eventDateTime = new Date(`${booking.eventDate}T${booking.startTime}:00Z`);
      const now = new Date();
      const hoursUntilEvent = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      const deadlineHours = booking.hall.cancellationDeadlineHours || 72;
      const policyRefundPercent = booking.hall.refundPercentage || 80;

      if (hoursUntilEvent >= deadlineHours) {
        refundAmount = Math.round(paidAmount * (policyRefundPercent / 100));
      } else {
        // Late cancellation: no refund or reduced refund
        refundAmount = 0;
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: refundAmount > 0 ? 'REFUNDED' : 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: session.userId,
        cancellationReason: reason,
        refundAmount,
        holdExpiresAt: null, // releases any hold
      },
    });

    // Notify Manager
    if (booking.hall.manager?.user?.id) {
      await createNotification({
        userId: booking.hall.manager.user.id,
        title: 'Booking Cancelled',
        message: `Booking ${booking.bookingNumber} for ${booking.hall.name} on ${booking.eventDate} has been cancelled.`,
        type: 'BOOKING',
        link: '/manager/bookings',
      });
    }

    // Notify Customer
    if (booking.customerId) {
      await createNotification({
        userId: booking.customerId,
        title: 'Booking Cancellation Confirmation',
        message: `Your booking ${booking.bookingNumber} has been cancelled. Refund amount: ₹${refundAmount.toLocaleString()}.`,
        type: 'BOOKING',
        link: `/bookings/${booking.id}`,
      });
    }

    // Audit log
    await createAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: 'BOOKING_CANCELLED',
      entityType: 'BOOKING',
      entityId: booking.id,
      details: {
        bookingNumber: booking.bookingNumber,
        refundAmount,
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      refundAmount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to cancel booking' }, { status: 500 });
  }
}
