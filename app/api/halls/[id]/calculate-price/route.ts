import { NextResponse } from 'next/server';
import { calculateHallPrice } from '@/lib/services/pricingService';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { eventDate, startTime, endTime, guestCount, cateringType = 'NONE', selectedAddonIds = [] } = body;

    if (!eventDate || !guestCount) {
      return NextResponse.json({ error: 'eventDate and guestCount are required' }, { status: 400 });
    }

    const hall = await prisma.hall.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const pricing = await calculateHallPrice({
      hallId: hall.id,
      eventDate,
      startTime,
      endTime,
      guestCount: parseInt(guestCount, 10),
      cateringType,
      selectedAddonIds,
    });

    return NextResponse.json({ pricing });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Price calculation failed' }, { status: 500 });
  }
}
