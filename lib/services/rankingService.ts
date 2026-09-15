import prisma from '../prisma';

export interface RankingWeights {
  ratingWeight: number;       // default 0.30
  reviewCountWeight: number;  // default 0.15
  bookingCountWeight: number; // default 0.25
  priceScoreWeight: number;   // default 0.15
  featuredWeight: number;     // default 0.15
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  ratingWeight: 0.30,
  reviewCountWeight: 0.15,
  bookingCountWeight: 0.25,
  priceScoreWeight: 0.15,
  featuredWeight: 0.15,
};

export async function getTopHalls(params?: {
  cityId?: string;
  citySlug?: string;
  occasionSlug?: string;
  limit?: number;
  weights?: Partial<RankingWeights>;
}) {
  const limit = params?.limit || 10;
  const weights: RankingWeights = { ...DEFAULT_RANKING_WEIGHTS, ...params?.weights };

  // Fetch approved halls with reviews, bookings, pricing rule, occasions, media
  const whereClause: any = {
    status: 'APPROVED',
  };

  if (params?.cityId) {
    whereClause.cityId = params.cityId;
  } else if (params?.citySlug) {
    whereClause.city = { slug: params.citySlug };
  }

  if (params?.occasionSlug) {
    whereClause.occasions = {
      some: {
        occasion: { slug: params.occasionSlug },
        status: 'APPROVED',
      },
    };
  }

  const halls = await prisma.hall.findMany({
    where: whereClause,
    include: {
      city: true,
      locality: true,
      media: { orderBy: { displayOrder: 'asc' } },
      pricingRule: true,
      reviews: { where: { status: 'APPROVED' } },
      bookings: { where: { status: 'CONFIRMED' } },
      occasions: {
        where: { status: 'APPROVED' },
        include: { occasion: true },
      },
      amenities: {
        include: { amenity: true },
      },
    },
  });

  if (halls.length === 0) {
    return [];
  }

  // Calculate city median price for price competitiveness
  const prices = halls
    .map((h) => h.pricingRule?.baseRentalPrice || 50000)
    .sort((a, b) => a - b);
  const medianPrice = prices[Math.floor(prices.length / 2)] || 50000;

  // Compute composite score for each hall
  const scoredHalls = halls.map((hall) => {
    // 1. Average Rating score (scale 0-1)
    const reviewCount = hall.reviews.length;
    const avgRating =
      reviewCount > 0
        ? hall.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
        : 4.0; // default baseline for new approved venues
    const ratingScore = avgRating / 5.0;

    // 2. Review count confidence factor (log-scaled, normalized up to 50 reviews)
    const reviewScore = Math.min(1, Math.log10(reviewCount + 1) / Math.log10(51));

    // 3. Booking popularity score (normalized up to 30 bookings)
    const bookingCount = hall.bookings.length;
    const bookingScore = Math.min(1, bookingCount / 30);

    // 4. Price competitiveness score (higher score for lower or fair price relative to median)
    const price = hall.pricingRule?.baseRentalPrice || 50000;
    const priceRatio = price / (medianPrice || 1);
    // If price <= median, score is high (1.0). If price is 2x median, score is 0.5.
    const priceScore = Math.min(1, Math.max(0.2, 1.0 - (priceRatio - 1) * 0.5));

    // 5. Featured status bonus
    const featuredScore = hall.isFeatured ? 1.0 : 0.0;

    const totalScore =
      ratingScore * weights.ratingWeight +
      reviewScore * weights.reviewCountWeight +
      bookingScore * weights.bookingCountWeight +
      priceScore * weights.priceScoreWeight +
      featuredScore * weights.featuredWeight;

    return {
      ...hall,
      averageRating: Number(avgRating.toFixed(1)),
      reviewCount,
      bookingCount,
      rankingScore: Number(totalScore.toFixed(4)),
    };
  });

  // Sort descending by calculated score
  scoredHalls.sort((a, b) => b.rankingScore - a.rankingScore);

  return scoredHalls.slice(0, limit);
}
