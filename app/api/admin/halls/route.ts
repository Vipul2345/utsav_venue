import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/adminAuth';
import { ADMIN_PERMISSIONS } from '@/lib/rbac';
import { createAuditLog } from '@/lib/services/auditService';
import { createNotification } from '@/lib/services/notificationService';

export async function GET(request: Request) {
  const { errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.VIEW_HALLS);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const halls = await prisma.hall.findMany({
      where,
      include: {
        city: true,
        locality: true,
        manager: {
          include: { user: { select: { fullName: true, email: true, phone: true } } },
        },
        pricingRule: true,
        media: true,
        occasions: {
          include: { occasion: true },
        },
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ halls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch halls' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hallId, action, rejectionReason, isFeatured } = body;

    if (!hallId || !action) {
      return NextResponse.json({ error: 'hallId and action are required' }, { status: 400 });
    }

    // Permission enforcement according to action
    let requiredPerm: import('@/lib/rbac').PermissionKey = ADMIN_PERMISSIONS.APPROVE_HALLS;
    if (action === 'REJECT') requiredPerm = ADMIN_PERMISSIONS.REJECT_HALLS;
    if (action === 'TOGGLE_FEATURED') requiredPerm = ADMIN_PERMISSIONS.MANAGE_HALLS;

    const { session, errorResponse } = await requireAdminPermission(requiredPerm);
    if (errorResponse) return errorResponse;

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        manager: { include: { user: true } },
        occasions: true,
        media: true,
      },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Media Moderation Actions
    if (action === 'APPROVE_MEDIA') {
      const { mediaId } = body;
      if (!mediaId) return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });

      const updatedMedia = await prisma.hallMedia.update({
        where: { id: mediaId },
        data: { verificationStatus: 'APPROVED', rejectionReason: null },
      });

      await createAuditLog({
        actorId: session.userId,
        actorRole: session.adminRole || 'ADMIN',
        actorEmail: session.email,
        action: 'HALL_MEDIA_APPROVED',
        entityType: 'HALL_MEDIA',
        entityId: mediaId,
        details: { hallId: hall.id, mediaId },
      });

      return NextResponse.json({ success: true, media: updatedMedia });
    }

    if (action === 'REJECT_MEDIA') {
      const { mediaId } = body;
      if (!mediaId) return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });

      const updatedMedia = await prisma.hallMedia.update({
        where: { id: mediaId },
        data: {
          verificationStatus: 'REJECTED',
          rejectionReason: rejectionReason?.trim() || 'Photo does not meet marketplace clarity/branding criteria',
        },
      });

      await createAuditLog({
        actorId: session.userId,
        actorRole: session.adminRole || 'ADMIN',
        actorEmail: session.email,
        action: 'HALL_MEDIA_REJECTED',
        entityType: 'HALL_MEDIA',
        entityId: mediaId,
        details: { hallId: hall.id, mediaId, rejectionReason },
      });

      return NextResponse.json({ success: true, media: updatedMedia });
    }

    if (action === 'APPROVE_ALL_MEDIA') {
      await prisma.hallMedia.updateMany({
        where: { hallId: hall.id },
        data: { verificationStatus: 'APPROVED', rejectionReason: null },
      });

      await createAuditLog({
        actorId: session.userId,
        actorRole: session.adminRole || 'ADMIN',
        actorEmail: session.email,
        action: 'HALL_ALL_MEDIA_APPROVED',
        entityType: 'HALL',
        entityId: hall.id,
        details: { hallId: hall.id },
      });

      return NextResponse.json({ success: true });
    }

    let updatedStatus = hall.status;
    let updateData: any = {};

    if (action === 'APPROVE') {
      updatedStatus = 'APPROVED';
      updateData = {
        status: 'APPROVED',
        rejectionReason: null,
        approvedAt: new Date(),
        approvedById: session.userId,
      };

      // Automatically approve requested occasions that were pending if approved
      await prisma.hallOccasion.updateMany({
        where: { hallId: hall.id, status: 'PENDING' },
        data: { status: 'APPROVED', approvedAt: new Date(), approvedById: session.userId },
      });

      // Automatically approve all pending media when whole hall is approved
      await prisma.hallMedia.updateMany({
        where: { hallId: hall.id, verificationStatus: 'PENDING' },
        data: { verificationStatus: 'APPROVED', rejectionReason: null },
      });
    } else if (action === 'REJECT') {
      if (!rejectionReason) {
        return NextResponse.json({ error: 'A rejection reason is mandatory when rejecting a venue listing.' }, { status: 400 });
      }
      updatedStatus = 'REJECTED';
      updateData = {
        status: 'REJECTED',
        rejectionReason,
        isFeatured: false, // Cannot be featured if rejected
      };
    } else if (action === 'SUSPEND') {
      updatedStatus = 'SUSPENDED';
      updateData = {
        status: 'SUSPENDED',
        isFeatured: false,
      };
    } else if (action === 'REACTIVATE') {
      updatedStatus = 'APPROVED';
      updateData = {
        status: 'APPROVED',
      };
    } else if (action === 'TOGGLE_FEATURED') {
      if (hall.status !== 'APPROVED') {
        return NextResponse.json({ error: 'A venue must be approved before it can be marked as Featured.' }, { status: 400 });
      }
      updateData = {
        isFeatured: Boolean(isFeatured),
      };
    }

    const updated = await prisma.hall.update({
      where: { id: hall.id },
      data: updateData,
    });

    // Notify manager
    if (hall.manager?.user?.id) {
      await createNotification({
        userId: hall.manager.user.id,
        title: `Venue Listing Update: ${hall.name}`,
        message:
          action === 'APPROVE'
            ? `Congratulations! ${hall.name} has been approved and is now live on the marketplace.`
            : action === 'REJECT'
            ? `Your venue ${hall.name} was rejected. Reason: ${rejectionReason}`
            : `Your venue ${hall.name} status was updated to ${updatedStatus}.`,
        type: 'APPROVAL',
        link: '/manager/halls',
      });
    }

    // Immutable audit log
    await createAuditLog({
      actorId: session.userId,
      actorRole: session.adminRole || 'ADMIN',
      actorEmail: session.email,
      action: `HALL_${action}`,
      entityType: 'HALL',
      entityId: hall.id,
      details: {
        hallName: hall.name,
        action,
        updatedStatus,
        rejectionReason,
      },
    });

    return NextResponse.json({ success: true, hall: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update hall status' }, { status: 500 });
  }
}
