import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { calculateHallPrice } from '../lib/services/pricingService';
import { createBookingWithLock, confirmBookingPayment, createExternalBooking } from '../lib/services/bookingService';
import { checkHallAvailability } from '../lib/services/availabilityService';

describe('End-to-End System Lifecycle Scenario', () => {
  let adminUser: any;
  let newManagerUser: any;
  let testCustomer: any;
  let createdHall: any;
  let weddingOccasion: any;
  let corporateOccasion: any;
  let birthdayOccasion: any;
  let cityBangalore: any;
  let localityKoramangala: any;
  let confirmedBooking: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({
      where: { email: 'superadmin@platform.com' },
      include: { adminProfile: true },
    });

    testCustomer = await prisma.user.upsert({
      where: { email: 'delivered@resend.dev' },
      update: { isActive: true },
      create: {
        email: 'delivered@resend.dev',
        fullName: 'Rahul Verma (Resend E2E)',
        passwordHash: 'dummy_hash_for_lifecycle_test',
        phone: '+919845011111',
        role: 'CUSTOMER',
        isActive: true,
      },
    });

    weddingOccasion = await prisma.occasion.findFirst({ where: { slug: 'wedding' } });
    corporateOccasion = await prisma.occasion.findFirst({ where: { slug: 'corporate-event' } });
    birthdayOccasion = await prisma.occasion.findFirst({ where: { slug: 'birthday-party' } });

    cityBangalore = await prisma.city.findFirst({ where: { slug: 'bangalore' } });
    localityKoramangala = await prisma.locality.findFirst({
      where: { cityId: cityBangalore.id, slug: 'koramangala' },
    });
  });

  afterAll(async () => {
    if (createdHall) {
      await prisma.review.deleteMany({ where: { hallId: createdHall.id } });
      await prisma.payment.deleteMany({ where: { booking: { hallId: createdHall.id } } });
      await prisma.bookingItem.deleteMany({ where: { booking: { hallId: createdHall.id } } });
      await prisma.booking.deleteMany({ where: { hallId: createdHall.id } });
      await prisma.availabilityBlock.deleteMany({ where: { hallId: createdHall.id } });
      await prisma.hallOccasion.deleteMany({ where: { hallId: createdHall.id } });
      await prisma.hallAmenity.deleteMany({ where: { hallId: createdHall.id } });
      await prisma.hallAddon.deleteMany({ where: { hallId: createdHall.id } });
      await prisma.pricingRule.deleteMany({ where: { hallId: createdHall.id } });
      await prisma.hallMedia.deleteMany({ where: { hallId: createdHall.id } });
      await prisma.hall.deleteMany({ where: { id: createdHall.id } });
    }
    if (newManagerUser) {
      await prisma.managerProfile.deleteMany({ where: { userId: newManagerUser.id } });
      await prisma.notification.deleteMany({ where: { userId: newManagerUser.id } });
      await prisma.user.deleteMany({ where: { id: newManagerUser.id } });
    }
    await prisma.$disconnect();
  });

  it('Step 1: Register a new Manager with business credentials', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    newManagerUser = await prisma.user.create({
      data: {
        email: `manager.e2e.${Date.now()}@example.com`,
        fullName: 'Vikas Agarwal',
        passwordHash,
        phone: '+919988776655',
        role: 'MANAGER',
        isActive: true,
        managerProfile: {
          create: {
            businessName: 'Agarwal Hospitality Group',
            businessRegistrationNumber: '29ABCDE1234F1Z5',
            taxId: 'ABCDE1234F',
            phone: '+919988776655',
            address: '100 Feet Road, Indiranagar, Bangalore',
            city: 'Bangalore',
            verificationStatus: 'PENDING',
          },
        },
      },
      include: { managerProfile: true },
    });

    expect(newManagerUser.role).toBe('MANAGER');
    expect(newManagerUser.managerProfile.verificationStatus).toBe('PENDING');
  });

  it('Step 2: Admin reviews and approves the Manager Profile', async () => {
    const updatedProfile = await prisma.managerProfile.update({
      where: { userId: newManagerUser.id },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: adminUser.id,
      },
    });

    expect(updatedProfile.verificationStatus).toBe('VERIFIED');
    expect(updatedProfile.verifiedAt).toBeDefined();
  });

  it('Step 3: Manager creates a venue with 3 occasions in PENDING_APPROVAL status', async () => {
    createdHall = await prisma.hall.create({
      data: {
        managerId: newManagerUser.managerProfile.id,
        cityId: cityBangalore.id,
        localityId: localityKoramangala.id,
        name: 'The Grand Sapphire Ballroom',
        slug: `grand-sapphire-ballroom-${Date.now()}`,
        description: 'Features Italian marble, central air-conditioning, state of the art lighting.',
        address: '5th Block, Koramangala, Bangalore',
        contactPhone: '+919988776655',
        contactEmail: newManagerUser.email,
        minCapacity: 100,
        maxCapacity: 600,
        status: 'PENDING_APPROVAL',
        pricingRule: {
          create: {
            baseRentalPrice: 100000,
            weekendMultiplier: 1.25,
            perPlateVegPrice: 750,
            perPlateNonVegPrice: 950,
            cleaningFee: 4000,
            securityDeposit: 25000,
            taxRatePercent: 18.0,
          },
        },
        occasions: {
          create: [
            { occasionId: weddingOccasion.id, status: 'PENDING' },
            { occasionId: birthdayOccasion.id, status: 'PENDING' },
            { occasionId: corporateOccasion.id, status: 'PENDING' },
          ],
        },
      },
      include: { occasions: true, pricingRule: true },
    });

    expect(createdHall.status).toBe('PENDING_APPROVAL');
    expect(createdHall.occasions.length).toBe(3);
    const publicFind = await prisma.hall.findFirst({
      where: { id: createdHall.id, status: 'APPROVED' },
    });
    expect(publicFind).toBeNull();
  });

  it('Step 4: Admin approves Hall, approves Wedding & Birthday, but rejects Corporate', async () => {
    await prisma.hall.update({
      where: { id: createdHall.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: adminUser.id,
        rejectionReason: null,
      },
    });

    await prisma.hallOccasion.updateMany({
      where: { hallId: createdHall.id, occasionId: weddingOccasion.id },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedById: adminUser.id, rejectionReason: null },
    });

    await prisma.hallOccasion.updateMany({
      where: { hallId: createdHall.id, occasionId: birthdayOccasion.id },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedById: adminUser.id, rejectionReason: null },
    });

    await prisma.hallOccasion.updateMany({
      where: { hallId: createdHall.id, occasionId: corporateOccasion.id },
      data: {
        status: 'REJECTED',
        rejectionReason: 'Venue lacks projection mapping and dedicated breakout rooms required for corporate conferences.',
      },
    });

    const hallOccasions = await prisma.hallOccasion.findMany({
      where: { hallId: createdHall.id },
    });

    const weddingAssoc = hallOccasions.find((o) => o.occasionId === weddingOccasion.id);
    const corporateAssoc = hallOccasions.find((o) => o.occasionId === corporateOccasion.id);
    const birthdayAssoc = hallOccasions.find((o) => o.occasionId === birthdayOccasion.id);

    expect(weddingAssoc?.status).toBe('APPROVED');
    expect(birthdayAssoc?.status).toBe('APPROVED');
    expect(corporateAssoc?.status).toBe('REJECTED');
    expect(corporateAssoc?.rejectionReason).toContain('lacks projection mapping');
  });

  it('Step 5: Customer discovers hall when searching for Bangalore + Wedding (300 guests)', async () => {
    const results = await prisma.hall.findMany({
      where: {
        cityId: cityBangalore.id,
        status: 'APPROVED',
        minCapacity: { lte: 300 },
        maxCapacity: { gte: 300 },
        occasions: {
          some: {
            occasionId: weddingOccasion.id,
            status: 'APPROVED',
          },
        },
      },
    });

    const found = results.some((h) => h.id === createdHall.id);
    expect(found).toBe(true);

    const corpResults = await prisma.hall.findMany({
      where: {
        cityId: cityBangalore.id,
        status: 'APPROVED',
        occasions: {
          some: {
            occasionId: corporateOccasion.id,
            status: 'APPROVED',
          },
        },
      },
    });
    const foundCorp = corpResults.some((h) => h.id === createdHall.id);
    expect(foundCorp).toBe(false);
  });

  it('Step 6 & 7: Customer places 10-min hold; concurrent customer overlap is rejected', async () => {
    const eventDate = '2026-11-20';
    const startTime = '17:00';
    const endTime = '23:00';

    const pricing = await calculateHallPrice({
      hallId: createdHall.id,
      eventDate,
      guestCount: 300,
      cateringType: 'VEG',
    });
    expect(pricing.totalAmount).toBeGreaterThan(0);

    const booking = await createBookingWithLock({
      hallId: createdHall.id,
      customerId: testCustomer.id,
      occasionId: weddingOccasion.id,
      eventDate,
      startTime,
      endTime,
      guestCount: 300,
      cateringType: 'VEG',
    });

    expect(booking.status).toBe('PAYMENT_PENDING');
    expect(booking.holdExpiresAt).toBeDefined();

    await expect(
      createBookingWithLock({
        hallId: createdHall.id,
        customerId: adminUser.id,
        occasionId: weddingOccasion.id,
        eventDate,
        startTime: '19:00',
        endTime: '23:59',
        guestCount: 150,
        cateringType: 'VEG',
      })
    ).rejects.toThrow(/already reserved or held/i);

    confirmedBooking = await confirmBookingPayment({
      bookingId: booking.id,
      amount: pricing.totalAmount,
      providerTransactionId: 'UPI-E2E-TEST-998811',
      waitForEmail: true,
    });

    expect(confirmedBooking.status).toBe('CONFIRMED');
    if ((confirmedBooking as any).emailDeliveryPromise) {
      const emailRes = await (confirmedBooking as any).emailDeliveryPromise;
      expect(emailRes.success).toBe(true);
    }

    const isAvail = await checkHallAvailability({
      hallId: createdHall.id,
      eventDate,
      startTime: '17:00',
      endTime: '23:00',
    });
    expect(isAvail.isAvailable).toBe(false);
  }, 25000);

  it('Step 8: Manager reserves an external/offline booking without platform fee', async () => {
    const eventDate = '2026-11-21';
    const startTime = '09:00';
    const endTime = '15:00';

    const externalBooking = await createExternalBooking({
      hallId: createdHall.id,
      managerId: newManagerUser.managerProfile.id,
      occasionId: birthdayOccasion.id,
      eventDate,
      startTime,
      endTime,
      guestCount: 120,
      customerName: 'Direct Walk-in Client',
      customerPhone: '+919876501234',
      totalAmount: 75000,
    });

    expect(externalBooking.status).toBe('CONFIRMED');
    expect(externalBooking.isExternal).toBe(true);
    expect(externalBooking.platformCommissionAmount).toBe(0);
    expect(externalBooking.externalCustomerName).toBe('Direct Walk-in Client');
  });

  it('Step 9: Customer submits a verified review', async () => {
    const review = await prisma.review.create({
      data: {
        hallId: createdHall.id,
        customerId: testCustomer.id,
        bookingId: confirmedBooking.id,
        rating: 5,
        title: 'Breathtaking venue and stellar service!',
        content: 'We celebrated our wedding here and the ambiance was world class. Highly recommended!',
        status: 'APPROVED',
      },
    });

    expect(review.id).toBeDefined();
    expect(review.rating).toBe(5);
    expect(review.bookingId).toBe(confirmedBooking.id);
  });
});
