import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSystemSettings } from '@/lib/settings';

export async function GET() {
  try {
    const [cities, occasions, amenities, settings] = await Promise.all([
      prisma.city.findMany({
        where: { isActive: true },
        include: {
          localities: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: [{ state: 'asc' }, { name: 'asc' }],
      }),
      prisma.occasion.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.amenity.findMany({
        orderBy: { name: 'asc' },
      }),
      getSystemSettings(),
    ]);

    return NextResponse.json({
      cities,
      occasions,
      amenities,
      maxHallImages: settings.maxHallImages,
      defaultTaxPercent: settings.defaultTaxPercent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch meta data' }, { status: 500 });
  }
}
