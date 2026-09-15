import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/adminAuth';

export async function GET() {
  const { errorResponse } = await requireAdminPermission();
  if (errorResponse) return errorResponse;

  try {
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalManagers = await prisma.managerProfile.count();
    const pendingManagers = await prisma.managerProfile.count({ where: { verificationStatus: 'PENDING' } });
    const totalHalls = await prisma.hall.count();
    const pendingHalls = await prisma.hall.count({ where: { status: 'PENDING_APPROVAL' } });
    const approvedHalls = await prisma.hall.count({ where: { status: 'APPROVED' } });

    const totalBookings = await prisma.booking.count();
    const confirmedBookings = await prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] } } });

    // Financial aggregates
    const confirmedList = await prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      select: {
        totalAmount: true,
        platformCommissionAmount: true,
        isExternal: true,
      },
    });

    const totalGMV = confirmedList.reduce((acc, b) => acc + b.totalAmount, 0);
    // Platform revenue only from online platform bookings (not external bookings)
    const platformRevenue = confirmedList
      .filter((b) => !b.isExternal)
      .reduce((acc, b) => acc + b.platformCommissionAmount, 0);

    // City distribution
    const cities = await prisma.city.findMany({
      include: {
        _count: { select: { halls: true } },
      },
    });

    const recentLogs = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { fullName: true, email: true } } },
    });

    return NextResponse.json({
      metrics: {
        totalCustomers,
        totalManagers,
        pendingManagers,
        totalHalls,
        pendingHalls,
        approvedHalls,
        totalBookings,
        confirmedBookings,
        totalGMV,
        platformRevenue,
      },
      cityDistribution: cities.map((c) => ({ name: c.name, hallCount: c._count.halls })),
      recentLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to compute admin metrics' }, { status: 500 });
  }
}
