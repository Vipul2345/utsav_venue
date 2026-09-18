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
            verificationStatus: true,
          },
        },
        pastEvents: {
          orderBy: { displayOrder: 'asc' },
        },
        packages: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
        media: {
          where: { verificationStatus: 'APPROVED' },
          orderBy: { displayOrder: 'asc' },
        },
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

    // Feature 10: Strict intermediary contact sanitization (never leak manager personal phone/email)
    const { contactPhone, contactEmail, ...sanitizedHall } = hall;

    return NextResponse.json({
      hall: {
        ...sanitizedHall,
        contactPhone: '1800-UTSAV-CARE',
        contactEmail: 'support@utsavvenues.com',
        conciergeSupport: {
          phone: '1800-UTSAV-CARE',
          email: 'support@utsavvenues.com',
          hours: '24/7 Concierge & Booking Care',
        },
        averageRating: avgRating,
        reviewCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve hall' }, { status: 500 });
  }
}
