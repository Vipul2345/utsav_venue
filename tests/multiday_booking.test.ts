import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '@/lib/prisma';
import { calculatePricingBreakdown } from '@/lib/services/pricingService';
import { isDateRangeOverlapping, checkHallAvailability } from '@/lib/services/availabilityService';
import { createBookingWithLock } from '@/lib/services/bookingService';
import { calculateHaversineDistanceKm } from '@/lib/services/locationService';

describe('Multi-Day Booking, Pricing, Security & Location-Aware Discovery Suite', () => {
  let testManagerUser: any;
  let testCustomerUserA: any;
  let testCustomerUserB: any;
  let testCity: any;
  let testLocality: any;
  let testHall: any;
  let testOccasion: any;

  beforeAll(async () => {
    // 1. Setup City & Locality
    testCity = await prisma.city.upsert({
      where: { slug: 'bangalore-test-md' },
      update: {},
      create: {
        name: 'Bangalore Test MD',
        slug: 'bangalore-test-md',
        state: 'Karnataka',
        country: 'India',
        isActive: true,
      },
    });

    testLocality = await prisma.locality.upsert({
      where: { id: 'loc-test-md-1' },
      update: {},
      create: {
        id: 'loc-test-md-1',
        cityId: testCity.id,
        name: 'Indiranagar Test',
        slug: 'indiranagar-test',
      },
    });

    // 2. Setup Manager & Customer Users
    testManagerUser = await prisma.user.create({
      data: {
        email: `manager.md.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_test',
        fullName: 'Test MD Manager',
        role: 'MANAGER',
        managerProfile: {
          create: {
            businessName: 'MD Venues Hospitality Ltd',
            phone: '+91 9988776655',
            verificationStatus: 'VERIFIED',
          },
        },
      },
      include: { managerProfile: true },
    });

    testCustomerUserA = await prisma.user.create({
      data: {
        email: `customer.a.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_test',
        fullName: 'Customer Alice',
        role: 'CUSTOMER',
      },
    });

    testCustomerUserB = await prisma.user.create({
      data: {
        email: `customer.b.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_test',
        fullName: 'Customer Bob',
        role: 'CUSTOMER',
      },
    });

    // 3. Setup Occasion
    testOccasion = await prisma.occasion.upsert({
      where: { slug: 'wedding-md-test' },
      update: {},
      create: {
        name: 'Wedding MD Test',
        slug: 'wedding-md-test',
      },
    });

    // 4. Setup Hall with Pricing Rule
    testHall = await prisma.hall.create({
      data: {
        managerId: testManagerUser.managerProfile.id,
        name: 'Grand Heritage MultiDay Palace',
        slug: `grand-heritage-palace-${Date.now()}`,
        description: 'Elite banquet palace for multi-day weddings and grand celebrations',
        cityId: testCity.id,
        localityId: testLocality.id,
        address: '100 Feet Road, Indiranagar',
        latitude: 12.9716,
        longitude: 77.5946,
        contactPhone: '+91 9988776655',
        contactEmail: 'contact@grandheritage.com',
        minCapacity: 100,
        maxCapacity: 1000,
        status: 'APPROVED',
        pricingRule: {
          create: {
            baseRentalPrice: 50000,
            cleaningFee: 5000,
            securityDeposit: 15000,
            perPlateVegPrice: 800,
            perPlateNonVegPrice: 1200,
            weekendMultiplier: 1.25, // 25% surcharge for Saturday / Sunday
          },
        },
        occasions: {
          create: {
            occasionId: testOccasion.id,
            status: 'APPROVED',
          },
        },
      },
      include: { pricingRule: true },
    });
  });

  afterAll(async () => {
    try {
      await prisma.booking.deleteMany({ where: { hallId: testHall.id } });
      await prisma.pricingRule.deleteMany({ where: { hallId: testHall.id } });
      await prisma.hallOccasion.deleteMany({ where: { hallId: testHall.id } });
      await prisma.hall.deleteMany({ where: { cityId: testCity.id } });
      await prisma.managerProfile.deleteMany({ where: { userId: testManagerUser.id } });
      await prisma.user.deleteMany({
        where: { id: { in: [testManagerUser.id, testCustomerUserA.id, testCustomerUserB.id] } },
      });
      await prisma.locality.deleteMany({ where: { cityId: testCity.id } });
      await prisma.city.delete({ where: { id: testCity.id } });
      await prisma.occasion.delete({ where: { id: testOccasion.id } });
    } catch {
      // Safe cleanup fallback
    } finally {
      await prisma.$disconnect();
    }
  });

  // ==========================================
  // 1. DURATION & DATE RANGE CALCULATIONS
  // ==========================================
  describe('1. Multi-Day Duration & Inclusive Day Calculation', () => {
    it('calculates single-day inclusive duration as 1 day (same start and end date)', () => {
      const pricing = calculatePricingBreakdown({
        baseRentalPrice: 50000,
        startDate: '2026-10-15',
        endDate: '2026-10-15',
        weekendMultiplier: 1.0,
      });

      expect(pricing.numberOfDays).toBe(1);
      expect(pricing.baseRental).toBe(50000);
    });

    it('calculates 3-day inclusive duration accurately (diff + 1)', () => {
      // 2026-10-16 to 2026-10-18 = Friday, Saturday, Sunday = 3 days
      const pricing = calculatePricingBreakdown({
        baseRentalPrice: 50000,
        startDate: '2026-10-16',
        endDate: '2026-10-18',
        weekendMultiplier: 1.0,
      });

      expect(pricing.numberOfDays).toBe(3);
      expect(pricing.baseRental).toBe(150000); // 50000 * 3
    });

    it('throws error when end date is strictly earlier than start date', () => {
      expect(() => {
        calculatePricingBreakdown({
          baseRentalPrice: 50000,
          startDate: '2026-10-20',
          endDate: '2026-10-18', // Invalid: end before start
        });
      }).toThrow(/End date cannot be earlier than start date/i);
    });
  });

  // ==========================================
  // 2. MULTI-DAY PRICING ENGINE & ITEMIZATION
  // ==========================================
  describe('2. Multi-Day Pricing Engine Itemization', () => {
    it('multiplies base rental by number of days while keeping flat cleaning fee flat', () => {
      // 4 days: 2026-10-12 (Mon) to 2026-10-15 (Thu) - no weekend days
      const pricing = calculatePricingBreakdown({
        baseRentalPrice: 60000,
        cleaningFee: 7500,
        startDate: '2026-10-12',
        endDate: '2026-10-15',
        weekendMultiplier: 1.25,
      });

      expect(pricing.numberOfDays).toBe(4);
      expect(pricing.dailyBaseRental).toBe(60000);
      expect(pricing.baseRental).toBe(240000); // 60,000 * 4
      expect(pricing.cleaningFee).toBe(7500); // Flat fee, not multiplied!
      expect(pricing.weekendSurcharge).toBe(0);
      expect(pricing.weekendDaysCount).toBe(0);
      // Tax: (240000 + 7500) * 0.18 = 44550
      expect(pricing.taxesAmount).toBe(44550);
      expect(pricing.totalAmount).toBe(292050);
    });

    it('accurately computes weekend prime surcharge only for weekend days in the range', () => {
      // 2026-10-16 (Friday), 2026-10-17 (Saturday), 2026-10-18 (Sunday)
      // Weekend multiplier = 1.20 (20% surcharge per weekend day = 10,000 per day)
      // Saturday and Sunday = 2 weekend days -> 2 * 10,000 = 20,000 surcharge
      const pricing = calculatePricingBreakdown({
        baseRentalPrice: 50000,
        cleaningFee: 5000,
        startDate: '2026-10-16',
        endDate: '2026-10-18',
        weekendMultiplier: 1.2,
      });

      expect(pricing.numberOfDays).toBe(3);
      expect(pricing.baseRental).toBe(150000);
      expect(pricing.weekendDaysCount).toBe(2);
      expect(pricing.weekendSurcharge).toBe(20000);
      // Subtotal before tax: 150000 + 20000 + 5000 = 175000
      // Tax (18%): 175000 * 0.18 = 31500
      expect(pricing.taxesAmount).toBe(31500);
      expect(pricing.totalAmount).toBe(206500);
    });

    it('itemizes catering charges per guest alongside multi-day venue rental', () => {
      const pricing = calculatePricingBreakdown({
        baseRentalPrice: 50000,
        cleaningFee: 5000,
        startDate: '2026-11-02', // Monday
        endDate: '2026-11-03',   // Tuesday (2 days)
        guestCount: 200,
        cateringType: 'VEG',
        perPlateVegPrice: 750,
      });

      expect(pricing.numberOfDays).toBe(2);
      expect(pricing.baseRental).toBe(100000);
      expect(pricing.cateringTotal).toBe(150000); // 200 * 750
      // Subtotal: 100000 + 150000 + 5000 = 255000
      // Tax: 255000 * 0.18 = 45900
      expect(pricing.taxesAmount).toBe(45900);
      expect(pricing.totalAmount).toBe(300900);
    });
  });

  // ==========================================
  // 3. RANGE OVERLAP AVAILABILITY & CONCURRENCY
  // ==========================================
  describe('3. Multi-Day Range Overlap & Concurrency Protection', () => {
    it('isDateRangeOverlapping correctly evaluates range overlaps', () => {
      // Exact same range
      expect(isDateRangeOverlapping('2026-12-01', '2026-12-05', '2026-12-01', '2026-12-05')).toBe(true);
      // Range B completely inside Range A
      expect(isDateRangeOverlapping('2026-12-01', '2026-12-10', '2026-12-03', '2026-12-07')).toBe(true);
      // Range B starts during Range A and ends after
      expect(isDateRangeOverlapping('2026-12-01', '2026-12-05', '2026-12-04', '2026-12-08')).toBe(true);
      // Range B ends on the start day of Range A (boundary touch is inclusive overlap)
      expect(isDateRangeOverlapping('2026-12-05', '2026-12-10', '2026-12-01', '2026-12-05')).toBe(true);
      // Range B is strictly before Range A
      expect(isDateRangeOverlapping('2026-12-10', '2026-12-15', '2026-12-01', '2026-12-08')).toBe(false);
      // Range B is strictly after Range A
      expect(isDateRangeOverlapping('2026-12-01', '2026-12-05', '2026-12-06', '2026-12-10')).toBe(false);
    });

    it('creates a 3-day hold and prevents overlapping bookings during hold', async () => {
      const startDate = '2026-12-10';
      const endDate = '2026-12-12'; // 3 days

      // Customer A places 10-minute hold for 3-day wedding celebration
      const bookingA = await createBookingWithLock({
        hallId: testHall.id,
        customerId: testCustomerUserA.id,
        occasionId: testOccasion.id,
        startDate,
        endDate,
        eventDate: startDate,
        startTime: '10:00',
        endTime: '22:00',
        guestCount: 250,
        cateringType: 'VEG',
      });

      expect(bookingA).toBeDefined();
      expect(bookingA.status).toBe('PAYMENT_PENDING');
      expect(bookingA.numberOfDays).toBe(3);
      expect(bookingA.startDate).toBe(startDate);
      expect(bookingA.endDate).toBe(endDate);

      // Check availability for overlapping range: 2026-12-11 to 2026-12-14
      const availCheckOverlap = await checkHallAvailability({
        hallId: testHall.id,
        startDate: '2026-12-11',
        endDate: '2026-12-14',
      });
      expect(availCheckOverlap.isAvailable).toBe(false);
      expect(availCheckOverlap.conflictReason).toMatch(/held|booked|hold|booking/i);

      // Customer B attempts concurrent booking on overlapping date: must be rejected
      await expect(
        createBookingWithLock({
          hallId: testHall.id,
          customerId: testCustomerUserB.id,
          occasionId: testOccasion.id,
          startDate: '2026-12-11',
          endDate: '2026-12-13',
          eventDate: '2026-12-11',
          startTime: '10:00',
          endTime: '22:00',
          guestCount: 200,
          cateringType: 'NONE',
        })
      ).rejects.toThrow(/overlaps with an existing booking or active hold/i);

      // Customer B on distinct non-overlapping dates succeeds!
      const bookingB = await createBookingWithLock({
        hallId: testHall.id,
        customerId: testCustomerUserB.id,
        occasionId: testOccasion.id,
        startDate: '2026-12-20',
        endDate: '2026-12-22',
        eventDate: '2026-12-20',
        startTime: '10:00',
        endTime: '22:00',
        guestCount: 200,
        cateringType: 'NONE',
      });

      expect(bookingB).toBeDefined();
      expect(bookingB.status).toBe('PAYMENT_PENDING');
      expect(bookingB.startDate).toBe('2026-12-20');
      expect(bookingB.endDate).toBe('2026-12-22');
    });
  });

  // ==========================================
  // 4. LOCATION-AWARE DISCOVERY & HAVERSINE
  // ==========================================
  describe('4. Location Detection, Haversine Calculation & Fallbacks', () => {
    it('calculates Haversine distance accurately between known GPS points', () => {
      // Bangalore (12.9716, 77.5946) to Mysore (12.2958, 76.6394) is ~128 km
      const distanceKm = calculateHaversineDistanceKm(12.9716, 77.5946, 12.2958, 76.6394);
      expect(distanceKm).toBeGreaterThan(120);
      expect(distanceKm).toBeLessThan(140);
    });

    it('detects 0 km for identical coordinates', () => {
      const dist = calculateHaversineDistanceKm(12.9716, 77.5946, 12.9716, 77.5946);
      expect(dist).toBe(0);
    });

    it('detects distance from user coordinates to venue in city', async () => {
      const userLat = 12.975;
      const userLng = 77.605;
      const dist = calculateHaversineDistanceKm(userLat, userLng, testHall.latitude, testHall.longitude);
      expect(dist).toBeLessThan(2.0); // Less than 2 km from Indiranagar
    });
  });
});
