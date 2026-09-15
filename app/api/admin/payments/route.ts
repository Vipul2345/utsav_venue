import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/adminAuth';
import { ADMIN_PERMISSIONS } from '@/lib/rbac';

export async function GET() {
  const { errorResponse } = await requireAdminPermission(ADMIN_PERMISSIONS.VIEW_PAYMENTS);
  if (errorResponse) return errorResponse;

  try {
    const payments = await prisma.payment.findMany({
      include: {
        booking: {
          include: {
            hall: { select: { name: true } },
            customer: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const bookingsWithPayouts = await prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED', 'REFUNDED'] } },
      select: {
        id: true,
        bookingNumber: true,
        eventDate: true,
        totalAmount: true,
        platformCommissionPercent: true,
        platformCommissionAmount: true,
        managerPayoutAmount: true,
        refundAmount: true,
        isExternal: true,
        hall: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      payments,
      financialLedger: bookingsWithPayouts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch payments ledger' }, { status: 500 });
  }
}
