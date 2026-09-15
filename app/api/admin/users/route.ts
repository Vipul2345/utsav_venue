import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/adminAuth';
import { ADMIN_PERMISSIONS } from '@/lib/rbac';
import { createAuditLog } from '@/lib/services/auditService';

export async function GET() {
  const { errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.VIEW_USERS);
  if (errorResponse) return errorResponse;

  try {
    const users = await prisma.user.findMany({
      include: {
        managerProfile: true,
        adminProfile: true,
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.MANAGE_USERS);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isActive = action === 'ACTIVATE';
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await createAuditLog({
      actorId: session.userId,
      actorRole: session.adminRole || 'ADMIN',
      actorEmail: session.email,
      action: `USER_${action}`,
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, isActive },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}
