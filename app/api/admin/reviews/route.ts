import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/adminAuth';
import { ADMIN_PERMISSIONS } from '@/lib/rbac';
import { createAuditLog } from '@/lib/services/auditService';

export async function GET() {
  const { errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.VIEW_REVIEWS);
  if (errorResponse) return errorResponse;

  try {
    const reviews = await prisma.review.findMany({
      include: {
        customer: { select: { fullName: true, email: true } },
        hall: { select: { id: true, name: true } },
        booking: { select: { bookingNumber: true, eventDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reviews });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.MANAGE_REVIEWS);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { reviewId, action } = body; // APPROVE, FLAG, HIDE, DELETE

    if (!reviewId || !action) {
      return NextResponse.json({ error: 'reviewId and action are required' }, { status: 400 });
    }

    if (action === 'DELETE') {
      await prisma.review.delete({ where: { id: reviewId } });
      return NextResponse.json({ success: true, deleted: true });
    }

    let status = 'APPROVED';
    if (action === 'FLAG') status = 'FLAGGED';
    if (action === 'HIDE') status = 'HIDDEN';

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });

    await createAuditLog({
      actorId: session.userId,
      actorRole: session.adminRole || 'ADMIN',
      actorEmail: session.email,
      action: `REVIEW_${action}`,
      entityType: 'REVIEW',
      entityId: reviewId,
      details: { status },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to moderate review' }, { status: 500 });
  }
}
