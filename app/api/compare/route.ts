import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculatePricingBreakdown } from '@/lib/services/pricingService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Missing venue IDs. Please provide 2 to 4 comma-separated venue IDs or slugs in ?ids=' },
        { status: 400 }
      );
    }

    const identifiers = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

    if (identifiers.length < 2 || identifiers.length > 4) {
      return NextResponse.json(
        { error: 'Comparison requires between 2 and 4 venues' },
        { status: 400 }
      );
    }

    // Optional EventBrief context for dynamic quote comparison
    const guestCount = searchParams.get('guests') ? parseInt(searchParams.get('guests')!, 10) : null;
    const date = searchParams.get('date') || undefined;
    const slot = searchParams.get('slot') || 'FULL_DAY';
    const eventType = searchParams.get('eventType') || 'Wedding';

    // Fetch venues
    const halls = await prisma.hall.findMany({
      where: {
        OR: [{ id: { in: identifiers } }, { slug: { in: identifiers } }],
        status: 'APPROVED',
      },
      include: {
        city: true,
        locality: true,
        media: {
          where: { verificationStatus: 'APPROVED' },
          orderBy: { displayOrder: 'asc' },
        },
        pricingRule: true,
        amenities: {
          include: { amenity: true },
        },
        occasions: {
          where: { status: 'APPROVED' },
          include: { occasion: true },
        },
        packages: {
          where: { isActive: true },
        },
        reviews: {
          where: { status: 'APPROVED' },
          select: { rating: true },
        },
      },
    });

    if (halls.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 approved venues must be found to compare' },
        { status: 404 }
      );
    }

    // Process and normalize venue comparison cards
    const normalizedVenues = halls.map((hall) => {
      const reviewCount = hall.reviews.length;
      const averageRating =
        reviewCount > 0
          ? Number((hall.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
          : 4.2;

      // Calculate comparable estimated price if event params are present
      let estimatedCost: number | null = null;
      let breakdown: any = null;

      if (guestCount && guestCount > 0) {
        const rule = hall.pricingRule || {
          baseRentalPrice: 50000,
          weekendMultiplier: 1.15,
          cleaningFee: 2000,
          securityDeposit: 10000,
          taxRatePercent: 18.0,
          tier1MinGuests: 100,
          tier1DiscountPercent: 5.0,
          tier2MinGuests: 200,
          tier2DiscountPercent: 8.0,
          tier3MinGuests: 300,
          tier3DiscountPercent: 12.0,
        };

        const calc = calculatePricingBreakdown({
          baseRentalPrice: rule.baseRentalPrice,
          weekendMultiplier: rule.weekendMultiplier,
          cleaningFee: rule.cleaningFee,
          securityDeposit: rule.securityDeposit,
          taxRatePercent: rule.taxRatePercent,
          startDate: date || new Date().toISOString().split('T')[0],
          endDate: date || new Date().toISOString().split('T')[0],
          guestCount,
          tier1MinGuests: rule.tier1MinGuests,
          tier1DiscountPercent: rule.tier1DiscountPercent,
          tier2MinGuests: rule.tier2MinGuests,
          tier2DiscountPercent: rule.tier2DiscountPercent,
          tier3MinGuests: rule.tier3MinGuests,
          tier3DiscountPercent: rule.tier3DiscountPercent,
        });

        estimatedCost = calc.totalAmount;
        breakdown = {
          baseRental: calc.baseRental,
          weekendSurcharge: calc.weekendSurcharge,
          cleaningFee: calc.cleaningFee,
          securityDeposit: rule.securityDeposit,
          bulkDiscountAmount: calc.bulkDiscountAmount,
          taxesAmount: calc.taxesAmount,
          totalAmount: calc.totalAmount,
        };
      }

      return {
        id: hall.id,
        name: hall.name,
        slug: hall.slug,
        city: hall.city.name,
        locality: hall.locality?.name || null,
        address: hall.address,
        venueType: hall.venueType || 'Banquet Hall',
        minCapacity: hall.minCapacity,
        maxCapacity: hall.maxCapacity,
        indoorAreaSqFt: hall.indoorAreaSqFt,
        outdoorAreaSqFt: hall.outdoorAreaSqFt,
        hasParking: hall.hasParking,
        parkingCapacity: hall.parkingCapacity,
        roomsCount: hall.roomsCount,
        isFeatured: hall.isFeatured,
        coverImage: hall.media.find((m) => m.isCover)?.url || hall.media[0]?.url || null,
        images: hall.media.slice(0, 4).map((m) => m.url),
        basePrice: hall.pricingRule?.baseRentalPrice || 0,
        pricingRule: hall.pricingRule,
        estimatedCost,
        breakdown,
        occasions: hall.occasions.map((ho) => ho.occasion.name),
        amenities: hall.amenities.map((ha) => ha.amenity.name),
        packages: hall.packages.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          description: p.description,
        })),
        policies: {
          cancellationPolicy: hall.cancellationPolicy,
          refundPercentage: hall.refundPercentage,
          cancellationDeadlineHours: hall.cancellationDeadlineHours,
          alcoholAllowed: hall.alcoholAllowed,
          outsideCateringAllowed: hall.outsideCateringAllowed,
          outsideDecorAllowed: hall.outsideDecorAllowed,
        },
        averageRating,
        reviewCount,
      };
    });

    // Identify winners/highlights across the compared set
    const highlights = {
      lowestPriceHallId: normalizedVenues.reduce((min, curr) =>
        (curr.estimatedCost || curr.basePrice) < (min.estimatedCost || min.basePrice) ? curr : min
      ).id,
      highestRatingHallId: normalizedVenues.reduce((max, curr) =>
        curr.averageRating > max.averageRating ? curr : max
      ).id,
      largestCapacityHallId: normalizedVenues.reduce((max, curr) =>
        curr.maxCapacity > max.maxCapacity ? curr : max
      ).id,
      mostRoomsHallId: normalizedVenues.reduce((max, curr) =>
        curr.roomsCount > max.roomsCount ? curr : max
      ).id,
      bestRefundHallId: normalizedVenues.reduce((max, curr) =>
        curr.policies.refundPercentage > max.policies.refundPercentage ? curr : max
      ).id,
    };

    return NextResponse.json({
      venues: normalizedVenues,
      highlights,
      queryContext: {
        guestCount,
        date,
        slot,
        eventType,
      },
    });
  } catch (error: any) {
    console.error('Comparison error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate venue comparison' },
      { status: 500 }
    );
  }
}
