import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/adminAuth';
import { ADMIN_PERMISSIONS } from '@/lib/rbac';

export async function GET(request: Request) {
  const { errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ auditLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
