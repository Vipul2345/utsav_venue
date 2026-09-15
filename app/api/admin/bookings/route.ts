import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/adminAuth';
import { ADMIN_PERMISSIONS } from '@/lib/rbac';
import { createAuditLog } from '@/lib/services/auditService';

export async function GET(request: Request) {
  const { errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.VIEW_BOOKINGS);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        hall: {
          include: {
            city: true,
            manager: { select: { businessName: true } },
          },
        },
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        occasion: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch admin bookings' }, { status: 500 });
  }
}
