import prisma from '../prisma';
import { CateringType, PricingBreakdown } from '../types';

export interface CalculatePriceInput {
  hallId: string;
  eventDate?: string; // YYYY-MM-DD (legacy / single date)
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  guestCount: number;
  cateringType: CateringType;
  selectedAddonIds?: string[];
}

export interface PricingCalculationOptions {
  baseRentalPrice: number;
  weekendMultiplier?: number;
  cleaningFee?: number;
  securityDeposit?: number;
  taxRatePercent?: number;
  startDate: string;
  endDate?: string;
  guestCount?: number;
  cateringType?: CateringType;
  perPlateVegPrice?: number;
  perPlateNonVegPrice?: number;
  addonsList?: { name: string; price: number; quantity: number; total: number }[];
  addonsTotal?: number;
  platformCommissionPercent?: number;
}

/**
 * Pure calculation function for itemized multi-day pricing breakdown
 */
export function calculatePricingBreakdown(options: PricingCalculationOptions): PricingBreakdown {
  const {
    baseRentalPrice,
    weekendMultiplier = 1.0,
    cleaningFee = 0,
    taxRatePercent = 18.0,
    startDate,
    endDate,
    guestCount = 0,
    cateringType = 'NONE',
    perPlateVegPrice = 0,
    perPlateNonVegPrice = 0,
    addonsList = [],
    addonsTotal = 0,
    platformCommissionPercent = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || '10'),
  } = options;

  const startStr = startDate || '';
  const endStr = endDate || startStr;

  if (startStr && endStr && endStr < startStr) {
    throw new Error('End date cannot be earlier than start date');
  }

  // Calculate inclusive number of days: diff in days + 1
  let numberOfDays = 1;
  let startMs = 0;
  if (startStr) {
    startMs = new Date(`${startStr}T00:00:00Z`).getTime();
    const endMs = new Date(`${endStr}T00:00:00Z`).getTime();
    const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
    numberOfDays = Math.max(1, diffDays + 1);
  }

  // Count weekend days (Saturday=6, Sunday=0) across the booked range
  let weekendDaysCount = 0;
  if (startMs > 0) {
    for (let d = 0; d < numberOfDays; d++) {
      const curDate = new Date(startMs + d * 24 * 60 * 60 * 1000);
      const dayOfWeek = curDate.getUTCDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendDaysCount++;
      }
    }
  }

  const isWeekend = weekendDaysCount > 0;
  const dailyBaseRental = baseRentalPrice;
  const baseRental = dailyBaseRental * numberOfDays;

  let weekendSurcharge = 0;
  if (weekendDaysCount > 0 && weekendMultiplier > 1) {
    const dailySurcharge = Math.round(baseRentalPrice * (weekendMultiplier - 1));
    weekendSurcharge = dailySurcharge * weekendDaysCount;
  }

  // Catering calculation
  let perPlateRate = 0;
  if (cateringType === 'VEG') {
    perPlateRate = perPlateVegPrice;
  } else if (cateringType === 'NON_VEG') {
    perPlateRate = perPlateNonVegPrice;
  }
  const cateringTotal = perPlateRate * guestCount;

  const subtotal = baseRental + weekendSurcharge + cateringTotal + addonsTotal + cleaningFee;
  const taxesAmount = Math.round(subtotal * (taxRatePercent / 100));
  const totalAmount = subtotal + taxesAmount;

  const platformCommissionAmount = Math.round(subtotal * (platformCommissionPercent / 100));
  const managerPayoutAmount = totalAmount - platformCommissionAmount;

  return {
    startDate: startStr,
    endDate: endStr,
    numberOfDays,
    dailyBaseRental,
    baseRental,
    isWeekend,
    weekendDaysCount,
    weekendSurcharge,
    cateringType,
    perPlateRate,
    guestCount,
    cateringTotal,
    addonsList,
    addonsTotal,
    cleaningFee,
    subtotal,
    taxRatePercent,
    taxesAmount,
    totalAmount,
    platformCommissionPercent,
    platformCommissionAmount,
    managerPayoutAmount,
  };
}

export async function calculateHallPrice(input: CalculatePriceInput): Promise<PricingBreakdown> {
  const {
    hallId,
    eventDate,
    startDate,
    endDate,
    startTime,
    endTime,
    guestCount,
    cateringType,
    selectedAddonIds = [],
  } = input;

  const startStr = startDate || eventDate || '';
  const endStr = endDate || startStr;

  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: {
      pricingRule: true,
      addons: true,
    },
  });

  if (!hall) {
    throw new Error('Hall not found');
  }

  const rule = hall.pricingRule || {
    baseRentalPrice: 50000,
    weekendMultiplier: 1.15,
    cleaningFee: 2000,
    securityDeposit: 10000,
    taxRatePercent: 18.0,
    perPlateVegPrice: 650,
    perPlateNonVegPrice: 850,
  };

  // Addons calculation
  let durationHours = 4;
  if (startTime && endTime) {
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    durationHours = Math.max(1, (h2 * 60 + m2 - (h1 * 60 + m1)) / 60);
  }

  const addonsList: PricingBreakdown['addonsList'] = [];
  let addonsTotal = 0;

  if (selectedAddonIds.length > 0 && hall.addons.length > 0) {
    const selectedAddons = hall.addons.filter((a) => selectedAddonIds.includes(a.id));
    for (const addon of selectedAddons) {
      let addonPrice = addon.price;
      let qty = 1;
      if (addon.pricingType === 'PER_GUEST') {
        qty = guestCount;
        addonPrice = addon.price * guestCount;
      } else if (addon.pricingType === 'PER_HOUR') {
        qty = Math.ceil(durationHours);
        addonPrice = addon.price * qty;
      }

      addonsTotal += addonPrice;
      addonsList.push({
        name: addon.name,
        price: addon.price,
        quantity: qty,
        total: addonPrice,
      });
    }
  }

  return calculatePricingBreakdown({
    baseRentalPrice: rule.baseRentalPrice,
    weekendMultiplier: rule.weekendMultiplier,
    cleaningFee: rule.cleaningFee,
    securityDeposit: rule.securityDeposit,
    taxRatePercent: rule.taxRatePercent,
    startDate: startStr,
    endDate: endStr,
    guestCount,
    cateringType,
    perPlateVegPrice: rule.perPlateVegPrice,
    perPlateNonVegPrice: rule.perPlateNonVegPrice,
    addonsList,
    addonsTotal,
  });
}
