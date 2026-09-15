import prisma from '../prisma';
import { CateringType, PricingBreakdown } from '../types';

export interface CalculatePriceInput {
  hallId: string;
  eventDate: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  guestCount: number;
  cateringType: CateringType;
  selectedAddonIds?: string[];
}

export async function calculateHallPrice(input: CalculatePriceInput): Promise<PricingBreakdown> {
  const { hallId, eventDate, startTime, endTime, guestCount, cateringType, selectedAddonIds = [] } = input;

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

  // Determine weekend (Saturday or Sunday)
  const dateObj = new Date(`${eventDate}T00:00:00Z`);
  const dayOfWeek = dateObj.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let baseRental = rule.baseRentalPrice;
  let weekendSurcharge = 0;
  if (isWeekend && rule.weekendMultiplier > 1) {
    baseRental = Math.round(rule.baseRentalPrice * rule.weekendMultiplier);
    weekendSurcharge = baseRental - rule.baseRentalPrice;
  }

  // Catering calculation
  let perPlateRate = 0;
  if (cateringType === 'VEG') {
    perPlateRate = rule.perPlateVegPrice;
  } else if (cateringType === 'NON_VEG') {
    perPlateRate = rule.perPlateNonVegPrice;
  }
  const cateringTotal = perPlateRate * guestCount;

  // Addons calculation
  // Calculate hours if start/end provided
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

  const cleaningFee = rule.cleaningFee || 0;
  const subtotal = baseRental + cateringTotal + addonsTotal + cleaningFee;

  const taxRatePercent = rule.taxRatePercent || 18.0;
  const taxesAmount = Math.round(subtotal * (taxRatePercent / 100));
  const totalAmount = subtotal + taxesAmount;

  // Platform Commission (configurable, default 10%)
  const platformCommissionPercent = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || '10');
  const platformCommissionAmount = Math.round(subtotal * (platformCommissionPercent / 100));
  const managerPayoutAmount = totalAmount - platformCommissionAmount;

  return {
    baseRental: rule.baseRentalPrice,
    isWeekend,
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
