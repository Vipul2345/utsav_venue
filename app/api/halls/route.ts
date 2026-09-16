import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkHallAvailability } from '@/lib/services/availabilityService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const citySlug = searchParams.get('city');
    const localitySlug = searchParams.get('locality');
    const occasionSlug = searchParams.get('occasion');
    const date = searchParams.get('date');
    const guests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!, 10) : null;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : null;
    const amenities = searchParams.get('amenities')?.split(',').filter(Boolean);
    const sortBy = searchParams.get('sortBy') || 'recommended';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    // Only APPROVED venues are visible to customers!
    const where: any = {
      status: 'APPROVED',
    };

    if (citySlug && citySlug !== 'all') {
      where.city = { slug: citySlug };
    }

    if (localitySlug) {
      where.locality = { slug: localitySlug };
    }

    // Occasion must be approved for this hall
    if (occasionSlug && occasionSlug !== 'all') {
      where.occasions = {
        some: {
          occasion: { slug: occasionSlug },
          status: 'APPROVED',
        },
      };
    }

    // Capacity matching
    if (guests && !isNaN(guests) && guests > 0) {
      where.minCapacity = { lte: guests };
      where.maxCapacity = { gte: guests };
    }

    // Amenities filtering
    if (amenities && amenities.length > 0) {
      where.amenities = {
        some: {
          amenityId: { in: amenities },
        },
      };
    }

    // Fetch halls
    let halls = await prisma.hall.findMany({
      where,
      include: {
        city: true,
        locality: true,
        media: {
          where: { verificationStatus: 'APPROVED' },
          orderBy: { displayOrder: 'asc' },
        },
        pricingRule: true,
        occasions: {
          where: { status: 'APPROVED' },
          include: { occasion: true },
        },
        amenities: {
          include: { amenity: true },
        },
        reviews: {
          where: { status: 'APPROVED' },
          select: { rating: true },
        },
        bookings: {
          where: { status: 'CONFIRMED' },
          select: { id: true },
        },
      },
    });

    // Post-filter pricing rule (if minPrice or maxPrice specified)
    if (minPrice !== null || maxPrice !== null) {
      halls = halls.filter((hall) => {
        const price = hall.pricingRule?.baseRentalPrice || 0;
        if (minPrice !== null && price < minPrice) return false;
        if (maxPrice !== null && price > maxPrice) return false;
        return true;
      });
    }

    // Compute average ratings
    const processedHalls = await Promise.all(
      halls.map(async (hall) => {
        const reviewCount = hall.reviews.length;
        const avgRating =
          reviewCount > 0
            ? Number((hall.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
            : 4.2;

        // If date was specified, check availability for typical evening slot
        let isDateAvailable = true;
        if (date) {
          const availCheck = await checkHallAvailability({
            hallId: hall.id,
            eventDate: date,
            startTime: '18:00',
            endTime: '23:00',
          });
          isDateAvailable = availCheck.isAvailable;
        }

        return {
          id: hall.id,
          name: hall.name,
          slug: hall.slug,
          description: hall.description,
          city: hall.city,
          locality: hall.locality,
          address: hall.address,
          minCapacity: hall.minCapacity,
          maxCapacity: hall.maxCapacity,
          indoorAreaSqFt: hall.indoorAreaSqFt,
          outdoorAreaSqFt: hall.outdoorAreaSqFt,
          hasParking: hall.hasParking,
          parkingCapacity: hall.parkingCapacity,
          roomsCount: hall.roomsCount,
          isFeatured: hall.isFeatured,
          coverImage: hall.media.find((m) => m.isCover)?.url || hall.media[0]?.url || null,
          media: hall.media,
          pricingRule: hall.pricingRule,
          occasions: hall.occasions.map((ho) => ho.occasion),
          amenities: hall.amenities.map((ha) => ha.amenity),
          averageRating: avgRating,
          reviewCount,
          isDateAvailable,
        };
      })
    );

    // Filter by rating if requested
    let filteredHalls = processedHalls;
    if (minRating !== null && !isNaN(minRating)) {
      filteredHalls = filteredHalls.filter((h) => h.averageRating >= minRating);
    }

    // If date requested, optionally prioritize or filter available venues
    if (date) {
      filteredHalls = filteredHalls.filter((h) => h.isDateAvailable);
    }

    // Sorting
    if (sortBy === 'price_asc') {
      filteredHalls.sort((a, b) => (a.pricingRule?.baseRentalPrice || 0) - (b.pricingRule?.baseRentalPrice || 0));
    } else if (sortBy === 'price_desc') {
      filteredHalls.sort((a, b) => (b.pricingRule?.baseRentalPrice || 0) - (a.pricingRule?.baseRentalPrice || 0));
    } else if (sortBy === 'capacity_desc') {
      filteredHalls.sort((a, b) => b.maxCapacity - a.maxCapacity);
    } else if (sortBy === 'rating_desc') {
      filteredHalls.sort((a, b) => b.averageRating - a.averageRating);
    } else {
      // Recommended / Default: Featured first, then highest rating
      filteredHalls.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.averageRating - a.averageRating;
      });
    }

    const total = filteredHalls.length;
    const paginated = filteredHalls.slice(skip, skip + limit);

    return NextResponse.json({
      halls: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message || 'Failed to search halls' }, { status: 500 });
  }
}
