import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { status, rejectionReason } = body;

    if (!status || !['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Status must be VERIFIED, REJECTED, or PENDING' }, { status: 400 });
    }

    if (status === 'REJECTED' && (!rejectionReason || !String(rejectionReason).trim())) {
      return NextResponse.json({ error: 'Rejection reason is required when rejecting an identity document' }, { status: 400 });
    }

    const doc = await prisma.bookingDocument.findUnique({
      where: { id },
      include: { booking: { select: { id: true, customerId: true, bookingNumber: true } } },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const updated = await prisma.bookingDocument.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? String(rejectionReason).trim() : null,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        verifiedById: status === 'VERIFIED' ? session.userId : null,
      },
    });

    // If customer has account, notify them of document status update
    if (doc.booking.customerId) {
      await prisma.notification.create({
        data: {
          userId: doc.booking.customerId,
          title: status === 'VERIFIED' ? 'ID Document Verified' : 'ID Document Action Required',
          message: status === 'VERIFIED'
            ? `Your identity document for ${doc.memberName} on booking ${doc.booking.bookingNumber} has been verified.`
            : `Your identity document for ${doc.memberName} was rejected: "${rejectionReason}". Please re-upload.`,
          type: 'SYSTEM',
          link: `/bookings/${doc.booking.id}`,
        },
      });
    }

    return NextResponse.json({ success: true, document: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update document status' }, { status: 500 });
  }
}
