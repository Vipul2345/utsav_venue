import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import { calculateHallPrice } from '../lib/services/pricingService';
import { createBookingWithLock } from '../lib/services/bookingService';

describe('Pricing Engine & Concurrency Locking', () => {
  let testHall: any;
  let testOccasion: any;
  let testCustomer: any;

  beforeAll(async () => {
    // Fetch a seeded hall (The Grand Kohinoor Palace)
    testHall = await prisma.hall.findFirst({
      where: { slug: 'the-grand-kohinoor-palace-bangalore' },
      include: { pricingRule: true, occasions: true },
    });

    testOccasion = await prisma.occasion.findFirst({
      where: { slug: 'wedding' },
    });

    testCustomer = await prisma.user.findFirst({
      where: { email: 'rahul.verma@example.com' },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Pricing: calculates correct guest catering & tax for weekday', async () => {
    // 2026-10-21 is a Wednesday (weekday)
    const result = await calculateHallPrice({
      hallId: testHall.id,
      eventDate: '2026-10-21',
      guestCount: 300,
      cateringType: 'VEG',
      selectedAddonIds: [],
    });

    expect(result.isWeekend).toBe(false);
    expect(result.weekendSurcharge).toBe(0);
    expect(result.baseRental).toBe(testHall.pricingRule.baseRentalPrice);
    expect(result.perPlateRate).toBe(testHall.pricingRule.perPlateVegPrice); // 850
    expect(result.cateringTotal).toBe(300 * 850); // 255000
    // Subtotal = 125000 - 15000 (12% bulk discount on base rental for 300 guests) + 255000 + 5000 (cleaning) = 370000
    expect(result.bulkDiscountAmount).toBe(15000);
    expect(result.subtotal).toBe(370000);
    // Taxes (18%) = 370000 * 0.18 = 66600
    expect(result.taxesAmount).toBe(66600);
    expect(result.totalAmount).toBe(436600);
    // Platform commission (10%) = 370000 * 0.10 = 37000
    expect(result.platformCommissionAmount).toBe(37000);
  });

  it('Pricing: applies weekendMultiplier for Saturday/Sunday', async () => {
    // 2026-10-24 is a Saturday (weekend)
    const result = await calculateHallPrice({
      hallId: testHall.id,
      eventDate: '2026-10-24',
      guestCount: 200,
      cateringType: 'NON_VEG',
    });

    expect(result.isWeekend).toBe(true);
    expect(result.weekendSurcharge).toBeGreaterThan(0);
  });

  it('Concurrency Lock: prevents double booking of overlapping slots', async () => {
    const testDate = '2026-12-15';
    const startTime = '16:00';
    const endTime = '22:00';

    // 1. Customer 1 books the slot
    const booking1 = await createBookingWithLock({
      hallId: testHall.id,
      customerId: testCustomer.id,
      occasionId: testOccasion.id,
      eventDate: testDate,
      startTime,
      endTime,
      guestCount: 250,
      cateringType: 'VEG',
    });

    expect(booking1.status).toBe('PAYMENT_PENDING');
    expect(booking1.holdExpiresAt).toBeDefined();

    // 2. Customer 2 immediately attempts to book an overlapping slot (18:00 - 23:00) on same date
    await expect(
      createBookingWithLock({
        hallId: testHall.id,
        customerId: testCustomer.id,
        occasionId: testOccasion.id,
        eventDate: testDate,
        startTime: '18:00',
        endTime: '23:00',
        guestCount: 250,
        cateringType: 'VEG',
      })
    ).rejects.toThrow(/already reserved or held/i);

    // 3. Clean up test booking
    await prisma.bookingItem.deleteMany({ where: { bookingId: booking1.id } });
    await prisma.booking.delete({ where: { id: booking1.id } });
  }, 15000);

  it('Validation: rejects booking if guest count exceeds maxCapacity', async () => {
    await expect(
      createBookingWithLock({
        hallId: testHall.id,
        customerId: testCustomer.id,
        occasionId: testOccasion.id,
        eventDate: '2026-12-20',
        startTime: '10:00',
        endTime: '15:00',
        guestCount: 5000, // exceeds maxCapacity 1500!
        cateringType: 'VEG',
      })
    ).rejects.toThrow(/exceeds venue maximum capacity/i);
  });
});
