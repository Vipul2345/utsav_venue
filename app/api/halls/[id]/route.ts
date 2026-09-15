import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hall = await prisma.hall.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        city: true,
        locality: true,
        manager: {
          select: {
            businessName: true,
            phone: true,
            verificationStatus: true,
          },
        },
        media: { orderBy: { displayOrder: 'asc' } },
        pricingRule: true,
        addons: true,
        occasions: {
          where: { status: 'APPROVED' }, // Only show approved occasions to customers!
          include: { occasion: true },
        },
        amenities: {
          include: { amenity: true },
        },
        reviews: {
          where: { status: 'APPROVED' },
          include: {
            customer: {
              select: { fullName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const reviewCount = hall.reviews.length;
    const avgRating =
      reviewCount > 0
        ? Number((hall.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 4.5;

    return NextResponse.json({
      hall: {
        ...hall,
        averageRating: avgRating,
        reviewCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve hall' }, { status: 500 });
  }
}
