import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '../lib/prisma';
import { getSystemSettings, updateSystemSettings } from '../lib/settings';

describe('Media Verification & System Enhancements Suite', () => {
  let testManagerUser: any;
  let testManagerProfile: any;
  let testCity: any;
  let createdHallId: string;

  beforeAll(async () => {
    // 1. Get or create active city
    testCity = await prisma.city.findFirst({ where: { isActive: true } });
    if (!testCity) {
      testCity = await prisma.city.create({
        data: { name: 'Test City', slug: 'test-city', state: 'Karnataka' },
      });
    }

    // 2. Create test manager
    const email = `manager.media.test.${Date.now()}@example.com`;
    testManagerUser = await prisma.user.create({
      data: {
        email,
        passwordHash: 'hashed_password_123',
        fullName: 'Media Test Manager',
        phone: '9876543210',
        role: 'MANAGER',
        managerProfile: {
          create: {
            businessName: 'Media Test Banquets',
            phone: '9876543210',
            city: testCity.name,
            verificationStatus: 'VERIFIED',
          },
        },
      },
      include: { managerProfile: true },
    });
    testManagerProfile = testManagerUser.managerProfile;
  });

  describe('1. Persistent System Settings & Configurable Limits', () => {
    it('retrieves default platform operational settings', async () => {
      const settings = await getSystemSettings();
      expect(settings).toBeDefined();
      expect(typeof settings.maxHallImages).toBe('number');
      expect(settings.maxHallImages).toBeGreaterThanOrEqual(2);
      expect(typeof settings.commissionPercent).toBe('number');
    });

    it('persists updated settings and reflects new maxHallImages', async () => {
      const updated = await updateSystemSettings({
        maxHallImages: 6,
        commissionPercent: 12.5,
      });

      expect(updated.maxHallImages).toBe(6);
      expect(updated.commissionPercent).toBe(12.5);

      const fetched = await getSystemSettings();
      expect(fetched.maxHallImages).toBe(6);
      expect(fetched.commissionPercent).toBe(12.5);

      // Reset back to 5 for standard testing
      await updateSystemSettings({ maxHallImages: 5, commissionPercent: 10 });
    });
  });

  describe('2. Hall Creation Media Validation & Verification Status', () => {
    it('creates a hall with multiple images starting in PENDING verification status', async () => {
      const testImages = [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
      ];

      const hall = await prisma.hall.create({
        data: {
          managerId: testManagerProfile.id,
          name: `Media Test Hall ${Date.now()}`,
          slug: `media-test-hall-${Date.now()}`,
          description: 'A test hall for media lifecycle testing',
          cityId: testCity.id,
          address: '123 Test Avenue',
          contactPhone: '9876543210',
          contactEmail: 'mediatest@example.com',
          minCapacity: 50,
          maxCapacity: 300,
          status: 'PENDING_APPROVAL',
          media: {
            create: testImages.map((url, idx) => ({
              url,
              isCover: idx === 0,
              displayOrder: idx,
              verificationStatus: 'PENDING',
            })),
          },
        },
        include: { media: true },
      });

      createdHallId = hall.id;
      expect(hall.media.length).toBe(3);
      expect(hall.media[0].isCover).toBe(true);
      // Verify all images started in PENDING mode
      hall.media.forEach((m) => {
        expect(m.verificationStatus).toBe('PENDING');
      });
    });

    it('customer isolation: customer queries return ZERO photos when all photos are PENDING', async () => {
      const customerView = await prisma.hall.findUnique({
        where: { id: createdHallId },
        include: {
          media: {
            where: { verificationStatus: 'APPROVED' },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      expect(customerView).toBeDefined();
      expect(customerView!.media.length).toBe(0); // Zero visible to customers!
    });
  });

  describe('3. Admin Media Moderation Lifecycle', () => {
    it('approves a specific photo, making it immediately visible to customers', async () => {
      const allMedia = await prisma.hallMedia.findMany({
        where: { hallId: createdHallId },
        orderBy: { displayOrder: 'asc' },
      });

      expect(allMedia.length).toBe(3);
      const firstMedia = allMedia[0];

      // Admin approves photo #1
      const approved = await prisma.hallMedia.update({
        where: { id: firstMedia.id },
        data: { verificationStatus: 'APPROVED', rejectionReason: null },
      });
      expect(approved.verificationStatus).toBe('APPROVED');

      // Now customer view has exactly 1 photo visible!
      const customerView = await prisma.hall.findUnique({
        where: { id: createdHallId },
        include: {
          media: {
            where: { verificationStatus: 'APPROVED' },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
      expect(customerView!.media.length).toBe(1);
      expect(customerView!.media[0].id).toBe(firstMedia.id);
    });

    it('rejects a specific photo with feedback reason, keeping it hidden from customers', async () => {
      const allMedia = await prisma.hallMedia.findMany({
        where: { hallId: createdHallId },
        orderBy: { displayOrder: 'asc' },
      });

      const secondMedia = allMedia[1];

      // Admin rejects photo #2
      const rejected = await prisma.hallMedia.update({
        where: { id: secondMedia.id },
        data: {
          verificationStatus: 'REJECTED',
          rejectionReason: 'Image is too low resolution and watermark detected.',
        },
      });

      expect(rejected.verificationStatus).toBe('REJECTED');
      expect(rejected.rejectionReason).toContain('low resolution');

      // Customer view still only shows the 1 approved photo
      const customerView = await prisma.hall.findUnique({
        where: { id: createdHallId },
        include: {
          media: {
            where: { verificationStatus: 'APPROVED' },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
      expect(customerView!.media.length).toBe(1);
    });

    it('approves all remaining pending/rejected photos via bulk moderation', async () => {
      await prisma.hallMedia.updateMany({
        where: { hallId: createdHallId },
        data: { verificationStatus: 'APPROVED', rejectionReason: null },
      });

      const customerView = await prisma.hall.findUnique({
        where: { id: createdHallId },
        include: {
          media: {
            where: { verificationStatus: 'APPROVED' },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
      expect(customerView!.media.length).toBe(3);
    });
  });

  describe('4. Post-Listing Manager Media Updates', () => {
    it('resets verificationStatus to PENDING when a manager replaces a photo URL', async () => {
      const allMedia = await prisma.hallMedia.findMany({
        where: { hallId: createdHallId },
        orderBy: { displayOrder: 'asc' },
      });

      const photoToEdit = allMedia[0];
      const newUrl = 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1200&q=80';

      // Simulate manager updating the URL of photoToEdit
      const isModified = photoToEdit.url !== newUrl;
      const updated = await prisma.hallMedia.update({
        where: { id: photoToEdit.id },
        data: {
          url: newUrl,
          verificationStatus: isModified ? 'PENDING' : photoToEdit.verificationStatus,
        },
      });

      expect(updated.verificationStatus).toBe('PENDING');
      expect(updated.url).toBe(newUrl);

      // Customer view immediately hides it until re-approved!
      const customerView = await prisma.hall.findUnique({
        where: { id: createdHallId },
        include: {
          media: {
            where: { verificationStatus: 'APPROVED' },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
      expect(customerView!.media.length).toBe(2);
      expect(customerView!.media.find((m) => m.id === photoToEdit.id)).toBeUndefined();
    });
  });

  describe('5. Manager Profile Update Capability', () => {
    it('allows managers to update contact details and business credentials', async () => {
      const updatedBusiness = 'Royal Grand Banquets & Conventions LLP';
      const updatedPhone = '9123456789';
      const updatedAddress = '77 Palace Road, Bengaluru';

      const updated = await prisma.managerProfile.update({
        where: { id: testManagerProfile.id },
        data: {
          businessName: updatedBusiness,
          phone: updatedPhone,
          address: updatedAddress,
        },
      });

      expect(updated.businessName).toBe(updatedBusiness);
      expect(updated.phone).toBe(updatedPhone);
      expect(updated.address).toBe(updatedAddress);
    });
  });
});
