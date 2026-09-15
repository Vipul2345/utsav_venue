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

    const halls = await prisma.hall.findMany({
      where: { managerId: managerProfile.id },
      include: {
        bookings: {
          include: { occasion: true },
        },
        reviews: true,
      },
    });

    const hallIds = halls.map((h) => h.id);
    const allBookings = halls.flatMap((h) => h.bookings);

    // Revenue by month
    const monthlyRevenueMap: Record<string, number> = {};
    for (const b of allBookings) {
      if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
        const monthKey = b.eventDate.slice(0, 7); // YYYY-MM
        monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + b.totalAmount;
      }
    }

    // Bookings by occasion
    const occasionMap: Record<string, number> = {};
    for (const b of allBookings) {
      const name = b.occasion?.name || 'Other Occasions';
      occasionMap[name] = (occasionMap[name] || 0) + 1;
    }

    // Performance per hall
    const hallPerformance = halls.map((h) => {
      const confirmed = h.bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
      const revenue = confirmed.reduce((acc, b) => acc + b.totalAmount, 0);
      const avgRating =
        h.reviews.length > 0
          ? Number((h.reviews.reduce((acc, r) => acc + r.rating, 0) / h.reviews.length).toFixed(1))
          : 0;

      return {
        id: h.id,
        name: h.name,
        status: h.status,
        totalBookings: h.bookings.length,
        confirmedBookings: confirmed.length,
        totalRevenue: revenue,
        averageRating: avgRating,
        reviewCount: h.reviews.length,
      };
    });

    return NextResponse.json({
      totalHalls: halls.length,
      totalBookings: allBookings.length,
      monthlyRevenue: monthlyRevenueMap,
      occasionBreakdown: occasionMap,
      hallPerformance,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
