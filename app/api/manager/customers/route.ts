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

    // Get bookings for this manager's halls
    const bookings = await prisma.booking.findMany({
      where: {
        hall: { managerId: managerProfile.id },
      },
      include: {
        customer: true,
        hall: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by customer email / phone
    const customerMap = new Map<string, any>();

    for (const b of bookings) {
      const email = b.customer?.email || (b.isExternal ? `ext_${b.externalCustomerName}` : 'unknown');
      const name = b.customer?.fullName || b.externalCustomerName || 'Guest Customer';
      const phone = b.customer?.phone || b.externalCustomerPhone || 'N/A';

      if (!customerMap.has(email)) {
        customerMap.set(email, {
          key: email,
          name,
          email: b.customer?.email || 'External / Phone Client',
          phone,
          isExternal: b.isExternal,
          totalBookings: 0,
          totalSpent: 0,
          lastBookingDate: b.eventDate,
          lastHallName: b.hall.name,
        });
      }

      const entry = customerMap.get(email);
      entry.totalBookings += 1;
      if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
        entry.totalSpent += b.totalAmount;
      }
    }

    return NextResponse.json({ customers: Array.from(customerMap.values()) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}
