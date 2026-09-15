import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        hall: {
          include: {
            city: true,
            locality: true,
            pricingRule: true,
            media: true,
            manager: {
              select: {
                businessName: true,
                phone: true,
              },
            },
          },
        },
        occasion: true,
        items: true,
        payments: true,
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        reviews: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Role-based security boundary / IDOR protection:
    if (session.role === 'CUSTOMER' && booking.customerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden: You cannot access another customer’s booking.' }, { status: 403 });
    }

    if (session.role === 'MANAGER') {
      const managerProfile = await prisma.managerProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!managerProfile || booking.hall.managerId !== managerProfile.id) {
        return NextResponse.json({ error: 'Forbidden: Venue does not belong to your manager account.' }, { status: 403 });
      }
    }

    return NextResponse.json({ booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve booking' }, { status: 500 });
  }
}
