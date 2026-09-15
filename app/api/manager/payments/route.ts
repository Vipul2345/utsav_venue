import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
    }

    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!managerProfile) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        hall: { managerId: managerProfile.id },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      include: {
        hall: { select: { name: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalGrossRevenue = 0;
    let totalPlatformCommissions = 0;
    let totalNetPayouts = 0;

    const paymentRecords = bookings.map((b) => {
      totalGrossRevenue += b.totalAmount;
      totalPlatformCommissions += b.platformCommissionAmount;
      totalNetPayouts += b.managerPayoutAmount;

      return {
        id: b.id,
        bookingNumber: b.bookingNumber,
        hallName: b.hall.name,
        eventDate: b.eventDate,
        isExternal: b.isExternal,
        totalAmount: b.totalAmount,
        platformCommission: b.platformCommissionAmount,
        netPayout: b.managerPayoutAmount,
        paymentStatus: b.payments[0]?.status || (b.isExternal ? 'OFFLINE_SETTLED' : 'PAID'),
        paidAt: b.payments[0]?.paidAt || b.createdAt,
      };
    });

    return NextResponse.json({
      summary: {
        totalGrossRevenue,
        totalPlatformCommissions,
        totalNetPayouts,
        totalBookings: bookings.length,
      },
      payments: paymentRecords,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 });
  }
}
