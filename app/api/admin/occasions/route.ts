import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/adminAuth';
import { ADMIN_PERMISSIONS } from '@/lib/rbac';
import { createAuditLog } from '@/lib/services/auditService';

export async function GET(request: Request) {
  const { errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.VIEW_HALLS);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const hallId = searchParams.get('hallId');

    const hallOccasions = await prisma.hallOccasion.findMany({
      where: hallId ? { hallId } : undefined,
      include: {
        hall: { select: { id: true, name: true, status: true } },
        occasion: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ hallOccasions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch hall occasions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.APPROVE_OCCASIONS);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { hallOccasionId, action, rejectionReason } = body;

    if (!hallOccasionId || !action) {
      return NextResponse.json({ error: 'hallOccasionId and action are required' }, { status: 400 });
    }

    const hallOcc = await prisma.hallOccasion.findUnique({
      where: { id: hallOccasionId },
      include: {
        hall: true,
        occasion: true,
      },
    });

    if (!hallOcc) {
      return NextResponse.json({ error: 'Hall occasion mapping not found' }, { status: 404 });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const updated = await prisma.hallOccasion.update({
      where: { id: hallOccasionId },
      data: {
        status: newStatus,
        rejectionReason: newStatus === 'REJECTED' ? rejectionReason || 'Not suitable for venue capacity or rules' : null,
        approvedAt: newStatus === 'APPROVED' ? new Date() : null,
        approvedById: session.userId,
      },
    });

    await createAuditLog({
      actorId: session.userId,
      actorRole: session.adminRole || 'ADMIN',
      actorEmail: session.email,
      action: `OCCASION_${newStatus}`,
      entityType: 'OCCASION',
      entityId: hallOcc.id,
      details: {
        hallName: hallOcc.hall.name,
        occasionName: hallOcc.occasion.name,
        newStatus,
        rejectionReason,
      },
    });

    return NextResponse.json({ success: true, hallOccasion: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update occasion status' }, { status: 500 });
  }
}
