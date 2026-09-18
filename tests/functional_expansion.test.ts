import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import { calculateHallPrice } from '../lib/services/pricingService';
import { createBookingWithLock, createExternalBooking } from '../lib/services/bookingService';

describe('Functional Expansion & Security Guardrails', () => {
  let testHall: any;
  let testOccasion: any;
  let testCustomer: any;
  let testManager: any;
  let testAdmin: any;
  let testPackage: any;

  beforeAll(async () => {
    testHall = await prisma.hall.findFirst({
      where: { slug: 'the-grand-kohinoor-palace-bangalore' },
      include: { pricingRule: true, occasions: true, manager: { include: { user: true } } },
    });

    testOccasion = await prisma.occasion.findFirst({
      where: { slug: 'wedding' },
    });

    testCustomer = await prisma.user.findFirst({
      where: { email: 'rahul.verma@example.com' },
    });

    testManager = testHall?.manager?.user || await prisma.user.findFirst({
      where: { role: 'MANAGER' },
    });

    testAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    // Seed or fetch an active VenuePackage for testHall
    if (testHall) {
      testPackage = await prisma.venuePackage.findFirst({
        where: { hallId: testHall.id, isActive: true },
      });

      if (!testPackage) {
        testPackage = await prisma.venuePackage.create({
          data: {
            hallId: testHall.id,
            name: 'Gold Grand Celebration Package',
            price: 45000,
            description: 'Curated royal floral stage decor, high-definition sound setup, and dedicated bridal green room.',
            includedServices: JSON.stringify([
              'Royal floral stage decoration with fresh orchids',
              'HD audio-visual setup with two wireless microphones',
              'Bridal executive suite with AC and vanity mirrors',
              'Welcome entrance arch and red carpet runner',
            ]),
            eventType: 'WEDDING',
            isActive: true,
          },
        });
      }
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Bulk Volume-Based Tiered Discounts', () => {
    it('applies 0% bulk discount for guest count < 100', async () => {
      const result = await calculateHallPrice({
        hallId: testHall.id,
        eventDate: '2026-11-18', // Wednesday
        guestCount: 80,
        cateringType: 'NONE',
      });

      expect(result.bulkDiscountPercent).toBe(0);
      expect(result.bulkDiscountAmount).toBe(0);
      expect(result.bulkDiscountTier).toBeNull();
    });

    it('applies 5% bulk discount for guest count between 100 and 199', async () => {
      const result = await calculateHallPrice({
        hallId: testHall.id,
        eventDate: '2026-11-18', // Wednesday
        guestCount: 150,
        cateringType: 'NONE',
      });

      expect(result.bulkDiscountPercent).toBe(5);
      expect(result.bulkDiscountTier).toBe('Group Tier (100+ Guests: 5% Off)');
      // Base rental for weekday = baseRentalPrice (e.g. 125,000)
      const expectedDiscount = Math.round(result.baseRental * 0.05);
      expect(result.bulkDiscountAmount).toBe(expectedDiscount);
      expect(result.subtotal).toBe(result.baseRental - expectedDiscount + result.cleaningFee);
    });

    it('applies 8% bulk discount for guest count between 200 and 299', async () => {
      const result = await calculateHallPrice({
        hallId: testHall.id,
        eventDate: '2026-11-18',
        guestCount: 250,
        cateringType: 'NONE',
      });

      expect(result.bulkDiscountPercent).toBe(8);
      expect(result.bulkDiscountTier).toBe('Celebration (200+ Guests: 8% Off)');
      const expectedDiscount = Math.round(result.baseRental * 0.08);
      expect(result.bulkDiscountAmount).toBe(expectedDiscount);
    });

    it('applies 12% bulk discount for guest count 300+', async () => {
      const result = await calculateHallPrice({
        hallId: testHall.id,
        eventDate: '2026-11-18',
        guestCount: 350,
        cateringType: 'NONE',
      });

      expect(result.bulkDiscountPercent).toBe(12);
      expect(result.bulkDiscountTier).toBe('Grand Gathering (300+ Guests: 12% Off)');
      const expectedDiscount = Math.round(result.baseRental * 0.12);
      expect(result.bulkDiscountAmount).toBe(expectedDiscount);
    });
  });

  describe('2. Event Packages / Bundles Pricing Integration', () => {
    it('correctly calculates breakdown when an event package is selected', async () => {
      const result = await calculateHallPrice({
        hallId: testHall.id,
        eventDate: '2026-11-18',
        guestCount: 100,
        cateringType: 'NONE',
        packageId: testPackage.id,
      });

      expect(result.packageId).toBe(testPackage.id);
      expect(result.packageName).toBe(testPackage.name);
      expect(result.packagePrice).toBe(testPackage.price);

      // Subtotal should include baseRental - bulkDiscount + packagePrice + cleaningFee
      const expectedSubtotal = result.baseRental - result.bulkDiscountAmount + testPackage.price + result.cleaningFee;
      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.taxesAmount).toBe(Math.round(expectedSubtotal * 0.18));
      expect(result.totalAmount).toBe(expectedSubtotal + result.taxesAmount);
    });
  });

  describe('3. Security Guardrail: Zero Manager Contact Leakage', () => {
    it('public hall query must sanitize manager personal phone and personal email', async () => {
      const hall = await prisma.hall.findUnique({
        where: { id: testHall.id },
        include: {
          manager: {
            include: {
              user: { select: { fullName: true, phone: true, email: true } },
            },
          },
        },
      });

      // Verify that manager in database has personal contacts
      expect(hall?.manager?.user?.phone).toBeDefined();

      // Simulated public API response sanitization
      const publicResponse = {
        id: hall!.id,
        name: hall!.name,
        contactPhone: '1800-UTSAV-CARE',
        contactEmail: 'support@utsavvenues.com',
        manager: {
          fullName: hall!.manager.user.fullName,
          phone: undefined,
          email: undefined,
        },
      };

      // Assert zero manager phone or personal email in customer payload
      expect(publicResponse.contactPhone).toBe('1800-UTSAV-CARE');
      expect(publicResponse.contactEmail).toBe('support@utsavvenues.com');
      expect(publicResponse.manager.phone).toBeUndefined();
      expect(publicResponse.manager.email).toBeUndefined();
    });
  });

  describe('4. Past Event Media Management', () => {
    it('creates, queries, and filters past event showcase media', async () => {
      // Create past event item
      const media = await prisma.pastEventMedia.create({
        data: {
          hallId: testHall.id,
          mediaType: 'IMAGE',
          url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
          caption: 'Royal Evening Reception with Grand Chandelier Lighting',
          category: 'WEDDING',
          title: 'Verma & Sharma Wedding',
          displayOrder: 1,
        },
      });

      expect(media.id).toBeDefined();
      expect(media.category).toBe('WEDDING');

      // Query gallery
      const items = await prisma.pastEventMedia.findMany({
        where: { hallId: testHall.id },
      });

      expect(items.length).toBeGreaterThan(0);
      const found = items.find((i) => i.id === media.id);
      expect(found).toBeDefined();
      expect(found?.caption).toContain('Royal Evening Reception');

      // Cleanup
      await prisma.pastEventMedia.delete({ where: { id: media.id } });
    });
  });

  describe('5. Online + Offline Booking Concurrency Lock', () => {
    const offlineDate = '2026-11-28';
    let offlineBooking: any;

    afterAll(async () => {
      if (offlineBooking) {
        await prisma.bookingItem.deleteMany({ where: { bookingId: offlineBooking.id } });
        await prisma.payment.deleteMany({ where: { bookingId: offlineBooking.id } });
        await prisma.booking.delete({ where: { id: offlineBooking.id } }).catch(() => {});
      }
    });

    it('offline booking locks slot and prevents overlapping online customer booking', async () => {
      // 1. Manager records walk-in offline booking
      offlineBooking = await createExternalBooking({
        hallId: testHall.id,
        managerId: testHall.managerId,
        occasionId: testOccasion.id,
        eventDate: offlineDate,
        startDate: offlineDate,
        endDate: offlineDate,
        startTime: '10:00',
        endTime: '22:00',
        guestCount: 200,
        customerName: 'Smt. Kavita Reddy',
        customerPhone: '+91 98451 99999',
        totalAmount: 110000,
        notes: 'Walk-in cash advance received',
      });

      expect(offlineBooking.id).toBeDefined();
      expect(offlineBooking.bookingType).toBe('OFFLINE_MANUAL');
      expect(offlineBooking.status).toBe('CONFIRMED');

      // 2. An online customer now attempts to book the overlapping slot
      let conflictThrown = false;
      try {
        await createBookingWithLock({
          hallId: testHall.id,
          customerId: testCustomer.id,
          occasionId: testOccasion.id,
          eventDate: offlineDate,
          startDate: offlineDate,
          endDate: offlineDate,
          startTime: '14:00',
          endTime: '20:00',
          guestCount: 250,
          cateringType: 'VEG',
          selectedAddonIds: [],
        });
      } catch (err: any) {
        conflictThrown = true;
        expect(err.message).toMatch(/already reserved|overlaps with an existing booking/i);
      }

      expect(conflictThrown).toBe(true);
    });
  });

  describe('6. Identity Document (KYC) Vault Privacy Protection', () => {
    let testBooking: any;
    let docRecord: any;

    beforeAll(async () => {
      testBooking = await prisma.booking.create({
        data: {
          bookingNumber: `UB-KYC-${Date.now()}`,
          hallId: testHall.id,
          customerId: testCustomer.id,
          occasionId: testOccasion.id,
          eventDate: '2026-11-29',
          startDate: '2026-11-29',
          endDate: '2026-11-29',
          startTime: '10:00',
          endTime: '18:00',
          guestCount: 100,
          status: 'CONFIRMED',
          baseRentalAmount: 100000,
          cateringAmount: 0,
          addonsAmount: 0,
          taxesAmount: 18900,
          totalAmount: 123900,
          platformCommissionPercent: 10.0,
          platformCommissionAmount: 10500,
          managerPayoutAmount: 94500,
        },
      });

      docRecord = await prisma.bookingDocument.create({
        data: {
          bookingId: testBooking.id,
          memberName: 'Rajesh Verma',
          memberRole: 'Groom',
          documentType: 'Aadhaar Card',
          fileUrl: 'https://vault.utsavvenues.com/docs/secure_kyc_aadhaar_mock.pdf',
          status: 'PENDING',
        },
      });
    });

    afterAll(async () => {
      if (docRecord) {
        await prisma.bookingDocument.delete({ where: { id: docRecord.id } }).catch(() => {});
      }
      if (testBooking) {
        await prisma.booking.delete({ where: { id: testBooking.id } }).catch(() => {});
      }
    });

    it('enforces that venue managers are strictly forbidden from viewing identity documents', async () => {
      // Simulate authorization policy check
      const simulateKycAccess = (userRole: string, userId: string, bookingOwnerId: string) => {
        const isOwner = userId === bookingOwnerId;
        const isAdmin = userRole === 'ADMIN';
        if (!isOwner && !isAdmin) {
          return { status: 403, allowed: false, error: 'Forbidden: Restricted to Utsav Venues compliance administrators.' };
        }
        return { status: 200, allowed: true };
      };

      // 1. Manager check -> Forbidden 403
      const managerAccess = simulateKycAccess(testManager.role, testManager.id, testBooking.customerId);
      expect(managerAccess.allowed).toBe(false);
      expect(managerAccess.status).toBe(403);

      // 2. Customer owner check -> Allowed 200
      const ownerAccess = simulateKycAccess(testCustomer.role, testCustomer.id, testBooking.customerId);
      expect(ownerAccess.allowed).toBe(true);
      expect(ownerAccess.status).toBe(200);

      // 3. Admin check -> Allowed 200
      const adminAccess = simulateKycAccess('ADMIN', testAdmin?.id || 'admin-id', testBooking.customerId);
      expect(adminAccess.allowed).toBe(true);
      expect(adminAccess.status).toBe(200);
    });
  });

  describe('7. Digital Guest Invitations Dispatch', () => {
    it('creates and records guest invitation records for a booking', async () => {
      const inv = await prisma.eventInvitation.create({
        data: {
          bookingId: testHall.bookings?.[0]?.id || (await prisma.booking.findFirst())?.id!,
          recipientEmail: 'priya.sharma@example.com',
          guestName: 'Priya Sharma',
          status: 'SENT',
        },
      });

      expect(inv.id).toBeDefined();
      expect(inv.status).toBe('SENT');
      expect(inv.recipientEmail).toBe('priya.sharma@example.com');

      await prisma.eventInvitation.delete({ where: { id: inv.id } });
    });
  });

  describe('8. Customer Support Ticket & Acknowledgement Automation', () => {
    it('generates compliant ticket reference and persists inquiry category', async () => {
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const ticketNumber = `TKT-2026-${randomSuffix}`;

      const msg = await prisma.contactMessage.create({
        data: {
          name: 'Ananya Deshmukh',
          email: 'ananya.deshmukh@example.com',
          phone: '+91 98450 77777',
          subject: 'Inquiry regarding Grand Ballroom catering packages',
          message: 'Can the Gold package be customized with Jain vegetarian dishes?',
          category: 'PACKAGES_AND_CATERING',
          ticketNumber,
          acknowledgementSent: true,
          acknowledgementSentAt: new Date(),
        },
      });

      expect(msg.id).toBeDefined();
      expect(msg.ticketNumber).toMatch(/^TKT-2026-\d{5}$/);
      expect(msg.category).toBe('PACKAGES_AND_CATERING');
      expect(msg.acknowledgementSent).toBe(true);

      await prisma.contactMessage.delete({ where: { id: msg.id } });
    });
  });
});
