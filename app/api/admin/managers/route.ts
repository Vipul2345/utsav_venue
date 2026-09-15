import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/adminAuth';
import { ADMIN_PERMISSIONS } from '@/lib/rbac';
import { createAuditLog } from '@/lib/services/auditService';
import { createNotification } from '@/lib/services/notificationService';

export async function GET() {
  const { errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.VIEW_MANAGERS);
  if (errorResponse) return errorResponse;

  try {
    const managers = await prisma.managerProfile.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, isActive: true } },
        _count: { select: { halls: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ managers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch managers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.VERIFY_MANAGERS);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { managerId, action, notes } = body;

    if (!managerId || !action) {
      return NextResponse.json({ error: 'managerId and action are required' }, { status: 400 });
    }

    const manager = await prisma.managerProfile.findUnique({
      where: { id: managerId },
      include: { user: true },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    let newStatus = manager.verificationStatus;
    if (action === 'VERIFY') newStatus = 'VERIFIED';
    else if (action === 'REJECT') newStatus = 'REJECTED';
    else if (action === 'SUSPEND') newStatus = 'SUSPENDED';
    else if (action === 'REACTIVATE') newStatus = 'VERIFIED';

    const updated = await prisma.managerProfile.update({
      where: { id: managerId },
      data: {
        verificationStatus: newStatus,
        verificationNotes: notes || null,
        verifiedAt: newStatus === 'VERIFIED' ? new Date() : null,
        verifiedById: session.userId,
      },
    });

    // Notify manager
    await createNotification({
      userId: manager.userId,
      title: `Manager Verification ${newStatus === 'VERIFIED' ? 'Approved' : newStatus}`,
      message:
        newStatus === 'VERIFIED'
          ? 'Your manager account has been verified. You can now create and publish banquet hall listings!'
          : `Your verification status is now ${newStatus}. Note: ${notes || 'Contact support for details.'}`,
      type: 'APPROVAL',
      link: '/manager/profile',
    });

    // Audit log
    await createAuditLog({
      actorId: session.userId,
      actorRole: session.adminRole || 'ADMIN',
      actorEmail: session.email,
      action: `MANAGER_VERIFICATION_${action}`,
      entityType: 'MANAGER',
      entityId: manager.id,
      details: {
        managerName: manager.user.fullName,
        businessName: manager.businessName,
        newStatus,
        notes,
      },
    });

    return NextResponse.json({ success: true, manager: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update manager verification' }, { status: 500 });
  }
}
