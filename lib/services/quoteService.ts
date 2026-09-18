import prisma from '../prisma';
import { calculateHallPrice } from './pricingService';

export interface CreateQuoteInput {
  hallId: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  guestCount: number;
  eventDate: string; // YYYY-MM-DD
  slot: string; // FULL_DAY, MORNING, EVENING
  packageId?: string | null;
  selectedAddons?: { addonId: string; quantity?: number }[];
  specialRequirements?: string | null;
  notes?: string | null;
}

export interface SanitizedHallSummary {
  id: string;
  name: string;
  slug: string;
  city: string;
  locality?: string | null;
  address: string;
  minCapacity: number;
  maxCapacity: number;
  venueType: string;
  featuredImage?: string | null;
  cancellationPolicy?: string | null;
  refundPercentage: number;
}

/**
 * Generate a unique quote reference number: UT-Q-YYYYMMDD-XXXX
 */
export function generateQuoteNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `UT-Q-${dateStr}-${randomSuffix}`;
}

/**
 * Create a new customer quote request with authoritative breakdown and lead generation.
 * Enforces zero direct manager contact: intermediary platform model.
 */
export async function createQuote(input: CreateQuoteInput) {
  const {
    hallId,
    userId,
    customerName,
    customerEmail,
    customerPhone,
    eventType,
    guestCount,
    eventDate,
    slot,
    packageId,
    selectedAddons = [],
    specialRequirements,
    notes,
  } = input;

  if (!customerName || !customerEmail || !customerPhone) {
    throw new Error('Customer contact details (name, email, phone) are required');
  }

  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: {
      city: true,
      locality: true,
      media: { take: 1, orderBy: { displayOrder: 'asc' } },
      pricingRule: true,
      packages: true,
      addons: true,
    },
  });

  if (!hall) {
    throw new Error('Venue not found');
  }

  if (guestCount < 1) {
    throw new Error('Guest count must be at least 1');
  }

  // Authoritative server-side price calculation
  const addonIds = selectedAddons.map((a) => a.addonId);
  const pricing = await calculateHallPrice({
    hallId,
    startDate: eventDate,
    endDate: eventDate,
    guestCount,
    cateringType: 'NONE', // Custom itemization
    selectedAddonIds: addonIds,
    packageId: packageId || undefined,
  });

  const quoteNumber = generateQuoteNumber();
  const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days validity

  const breakdown = {
    baseRentalPrice: pricing.baseRental,
    weekendSurcharge: pricing.weekendSurcharge,
    packagePrice: pricing.packagePrice,
    packageName: pricing.packageName,
    addonsList: pricing.addonsList,
    addonsTotal: pricing.addonsTotal,
    bulkDiscountAmount: pricing.bulkDiscountAmount,
    bulkDiscountPercent: pricing.bulkDiscountPercent,
    cleaningFee: pricing.cleaningFee,
    securityDeposit: hall.pricingRule?.securityDeposit || 0,
    taxRatePercent: pricing.taxRatePercent,
    taxesAmount: pricing.taxesAmount,
    totalEstimatedAmount: pricing.totalAmount,
    numberOfDays: pricing.numberOfDays,
    slot,
    guestCount,
    eventType,
    validUntil: validUntil.toISOString(),
  };

  // Create Quote & Lead in a transaction
  const quote = await prisma.$transaction(async (tx) => {
    const newQuote = await tx.quote.create({
      data: {
        quoteNumber,
        hallId,
        userId: userId || null,
        customerName,
        customerEmail,
        customerPhone,
        eventType,
        guestCount,
        eventDate: new Date(`${eventDate}T00:00:00Z`),
        slot: slot.toUpperCase(),
        status: 'REQUESTED',
        packageId: packageId || null,
        selectedAddons: JSON.stringify(selectedAddons),
        baseHallRent: pricing.baseRental + pricing.weekendSurcharge,
        cateringCost: 0,
        decorCost: pricing.packagePrice,
        addonsCost: pricing.addonsTotal,
        cleaningFee: pricing.cleaningFee,
        securityDeposit: hall.pricingRule?.securityDeposit || 0,
        taxes: pricing.taxesAmount,
        totalEstimatedAmount: pricing.totalAmount,
        validUntil,
        notes: notes || null,
        specialRequirements: specialRequirements || null,
        isUtsavIntermediated: true,
      },
    });

    // Create initial QuoteVersion
    await tx.quoteVersion.create({
      data: {
        quoteId: newQuote.id,
        versionNumber: 1,
        breakdownJson: JSON.stringify(breakdown),
        totalAmount: pricing.totalAmount,
        notes: 'Initial automated quote estimate based on customer requirements',
      },
    });

    // Create linked Lead for Utsav concierge follow-up
    await tx.lead.create({
      data: {
        hallId,
        userId: userId || null,
        quoteId: newQuote.id,
        customerName,
        customerPhone,
        customerEmail,
        eventType,
        guestCount,
        targetDate: new Date(`${eventDate}T00:00:00Z`),
        budgetRange: `₹${pricing.totalAmount.toLocaleString('en-IN')}`,
        status: 'NEW',
        source: 'QUOTE_ENGINE',
        notes: `Automated Quote requested for ${eventType} (${guestCount} guests)`,
      },
    });

    return newQuote;
  });

  return {
    quote,
    breakdown,
    sanitizedHall: sanitizeHallData(hall),
  };
}

/**
 * Sanitize hall data to ensure ZERO customer-to-manager contact details leak.
 */
export function sanitizeHallData(hall: any): SanitizedHallSummary {
  return {
    id: hall.id,
    name: hall.name,
    slug: hall.slug,
    city: hall.city?.name || '',
    locality: hall.locality?.name || null,
    address: hall.address,
    minCapacity: hall.minCapacity,
    maxCapacity: hall.maxCapacity,
    venueType: hall.venueType || 'Banquet Hall',
    featuredImage: hall.media?.[0]?.url || null,
    cancellationPolicy: hall.cancellationPolicy,
    refundPercentage: hall.refundPercentage,
  };
}

/**
 * Get quote details by quoteNumber or ID, returning complete breakdown and sanitized venue.
 */
export async function getQuote(idOrNumber: string) {
  const quote = await prisma.quote.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { quoteNumber: idOrNumber }],
    },
    include: {
      hall: {
        include: {
          city: true,
          locality: true,
          media: { take: 1, orderBy: { displayOrder: 'asc' } },
        },
      },
      versions: {
        orderBy: { versionNumber: 'desc' },
      },
      lead: true,
    },
  });

  if (!quote) {
    return null;
  }

  // Strictly sanitize hall data
  const sanitizedHall = sanitizeHallData(quote.hall);
  const latestVersion = quote.versions[0] || null;
  const breakdown = latestVersion ? JSON.parse(latestVersion.breakdownJson) : null;

  return {
    ...quote,
    hall: sanitizedHall,
    breakdown,
  };
}

/**
 * List quotes for a customer (by userId or customerEmail)
 */
export async function listCustomerQuotes(userId?: string, customerEmail?: string) {
  if (!userId && !customerEmail) return [];

  const whereClause: any = {};
  if (userId && customerEmail) {
    whereClause.OR = [{ userId }, { customerEmail }];
  } else if (userId) {
    whereClause.userId = userId;
  } else {
    whereClause.customerEmail = customerEmail;
  }

  const quotes = await prisma.quote.findMany({
    where: whereClause,
    include: {
      hall: {
        include: {
          city: true,
          locality: true,
          media: { take: 1, orderBy: { displayOrder: 'asc' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return quotes.map((q) => ({
    ...q,
    hall: sanitizeHallData(q.hall),
  }));
}

/**
 * Update quote status (e.g. ACCEPTED, REJECTED, CONVERTED)
 */
export async function updateQuoteStatus(quoteId: string, status: string, notes?: string) {
  return await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status,
      notes: notes !== undefined ? notes : undefined,
    },
  });
}
