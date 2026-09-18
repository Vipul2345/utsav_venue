import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import {
  serializeEventBriefToQuery,
  parseEventBriefFromQuery,
  SEATING_STYLES,
  VENUE_TYPES,
  EventBrief,
} from '../lib/types/eventBrief';
import {
  createQuote,
  getQuote,
  updateQuoteStatus,
  sanitizeHallData,
} from '../lib/services/quoteService';

describe('Master Product Upgrade: Discovery, Smart Filtering, Quotes & Zero Leak Security', () => {
  let testHall: any;
  let testUser: any;
  let createdQuoteId: string;
  let createdQuoteNumber: string;

  beforeAll(async () => {
    testHall = await prisma.hall.findFirst({
      include: {
        city: true,
        locality: true,
        pricingRule: true,
        manager: {
          include: {
            user: true,
          },
        },
      },
    });

    testUser = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' },
    });
  });

  afterAll(async () => {
    // Clean up created test quote and linked lead
    if (createdQuoteId) {
      try {
        await prisma.lead.deleteMany({ where: { quoteId: createdQuoteId } });
        await prisma.quoteVersion.deleteMany({ where: { quoteId: createdQuoteId } });
        await prisma.quote.delete({ where: { id: createdQuoteId } });
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    await prisma.$disconnect();
  });

  describe('1. EventBrief URL Parameter Serialization & Deserialization', () => {
    it('accurately serializes and deserializes comprehensive event requirements', () => {
      const originalBrief: Partial<EventBrief> = {
        eventType: 'Wedding',
        guestCount: 350,
        city: 'bangalore',
        date: '2026-11-20',
        flexibilityDays: 3,
        slot: 'EVENING',
        budgetTotal: 500000,
        budgetPerPlate: 1200,
        cateringPreference: 'VEG_ONLY',
        spaceType: 'INDOOR',
        venueType: 'Banquet Hall',
        seatingStyle: 'ROUND_TABLE',
        roomsNeeded: 10,
        parkingNeeded: true,
        alcoholPermitted: true,
        djMusicAllowed: true,
      };

      const queryString = serializeEventBriefToQuery(originalBrief);
      expect(queryString).toContain('eventType=Wedding');
      expect(queryString).toContain('guestCount=350');
      expect(queryString).toContain('city=bangalore');
      expect(queryString).toContain('seating=ROUND_TABLE');
      expect(queryString).toContain('alcohol=true');

      const parsed = parseEventBriefFromQuery(new URLSearchParams(queryString));
      expect(parsed.eventType).toBe('Wedding');
      expect(parsed.guestCount).toBe(350);
      expect(parsed.city).toBe('bangalore');
      expect(parsed.date).toBe('2026-11-20');
      expect(parsed.flexibilityDays).toBe(3);
      expect(parsed.slot).toBe('EVENING');
      expect(parsed.budgetTotal).toBe(500000);
      expect(parsed.budgetPerPlate).toBe(1200);
      expect(parsed.cateringPreference).toBe('VEG_ONLY');
      expect(parsed.spaceType).toBe('INDOOR');
      expect(parsed.venueType).toBe('Banquet Hall');
      expect(parsed.seatingStyle).toBe('ROUND_TABLE');
      expect(parsed.roomsNeeded).toBe(10);
      expect(parsed.parkingNeeded).toBe(true);
      expect(parsed.alcoholPermitted).toBe(true);
      expect(parsed.djMusicAllowed).toBe(true);
    });
  });

  describe('2. Seating Arrangement & Density Ratios', () => {
    it('provides correct density ratios for all standard seating arrangements', () => {
      const styles = Object.fromEntries(SEATING_STYLES.map((s) => [s.id, s.ratio]));
      expect(styles['FLOATING']).toBe(1.0);
      expect(styles['THEATRE']).toBe(0.85);
      expect(styles['ROUND_TABLE']).toBe(0.65);
      expect(styles['CLASSROOM']).toBe(0.55);

      const maxBaseCapacity = 1000;
      const roundTableCapacity = Math.floor(maxBaseCapacity * styles['ROUND_TABLE']);
      const classroomCapacity = Math.floor(maxBaseCapacity * styles['CLASSROOM']);
      expect(roundTableCapacity).toBe(650);
      expect(classroomCapacity).toBe(550);
    });
  });

  describe('3. Automated Authoritative Quote Generation', () => {
    it('creates quote with authoritative calculations and rejects invalid guest count', async () => {
      if (!testHall) return;

      await expect(
        createQuote({
          hallId: testHall.id,
          customerName: 'Aarav Sharma',
          customerEmail: 'aarav@example.com',
          customerPhone: '9876543210',
          eventType: 'Reception',
          guestCount: 0,
          eventDate: '2026-12-15',
          slot: 'EVENING',
        })
      ).rejects.toThrow('Guest count must be at least 1');

      const result = await createQuote({
        hallId: testHall.id,
        userId: testUser?.id || null,
        customerName: 'Aarav Sharma',
        customerEmail: 'aarav@example.com',
        customerPhone: '9876543210',
        eventType: 'Reception',
        guestCount: 250,
        eventDate: '2026-12-15',
        slot: 'EVENING',
        notes: 'Need stage setup by 4 PM',
      });

      expect(result).toBeDefined();
      expect(result.quote).toBeDefined();
      expect(result.quote.quoteNumber).toMatch(/^UT-Q-\d{8}-[A-Z0-9]{4}$/);
      expect(result.quote.status).toBe('REQUESTED');
      expect(result.quote.totalEstimatedAmount).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.totalEstimatedAmount).toBe(result.quote.totalEstimatedAmount);
      expect(result.quote.isUtsavIntermediated).toBe(true);

      createdQuoteId = result.quote.id;
      createdQuoteNumber = result.quote.quoteNumber;
    });
  });

  describe('4. Platform Intermediary & Linked Lead Generation', () => {
    it('generates an internal lead linked to quote for concierge follow-up', async () => {
      if (!createdQuoteId) return;

      const lead = await prisma.lead.findFirst({
        where: { quoteId: createdQuoteId },
      });

      expect(lead).toBeDefined();
      expect(lead?.customerName).toBe('Aarav Sharma');
      expect(lead?.customerPhone).toBe('9876543210');
      expect(lead?.source).toBe('QUOTE_ENGINE');
      expect(lead?.status).toBe('NEW');
    });
  });

  describe('5. Strict Zero Manager Contact Leakage via sanitizeHallData', () => {
    it('completely strips private manager phone, email, and user objects from venue output', () => {
      const mockRawHallWithManager = {
        id: 'test-hall-uuid',
        name: 'The Royal Emerald Ballroom',
        slug: 'royal-emerald-ballroom',
        address: 'MG Road, Bangalore',
        minCapacity: 100,
        maxCapacity: 800,
        venueType: 'Hotel Ballroom',
        cancellationPolicy: 'Moderate',
        refundPercentage: 80,
        city: { id: 'city-1', name: 'Bangalore', slug: 'bangalore' },
        locality: { id: 'loc-1', name: 'Central Bangalore', slug: 'central-bangalore' },
        media: [{ url: 'https://images.example.com/hall1.jpg' }],
        // CONFIDENTIAL MANAGER & OWNER DATA THAT MUST NEVER LEAK
        managerId: 'manager-profile-123',
        manager: {
          id: 'manager-profile-123',
          phone: '+91 9988776655',
          email: 'manager.emerald@secret-hotel.com',
          user: {
            id: 'user-manager-id',
            name: 'Secret Venue Owner',
            email: 'private.owner@secret-hotel.com',
            phone: '+91 9123456780',
          },
        },
      };

      const sanitized = sanitizeHallData(mockRawHallWithManager);

      expect(sanitized.id).toBe('test-hall-uuid');
      expect(sanitized.name).toBe('The Royal Emerald Ballroom');
      expect(sanitized.city).toBe('Bangalore');
      expect(sanitized.venueType).toBe('Hotel Ballroom');

      // VERIFY ABSOLUTE CONFIDENTIALITY
      expect((sanitized as any).manager).toBeUndefined();
      expect((sanitized as any).managerId).toBeUndefined();
      expect((sanitized as any).phone).toBeUndefined();
      expect((sanitized as any).email).toBeUndefined();
      expect(JSON.stringify(sanitized)).not.toContain('9988776655');
      expect(JSON.stringify(sanitized)).not.toContain('9123456780');
      expect(JSON.stringify(sanitized)).not.toContain('secret-hotel.com');
      expect(JSON.stringify(sanitized)).not.toContain('Secret Venue Owner');
    });
  });

  describe('6. Quote Retrieval with Sanitized Hall Specs', () => {
    it('retrieves quote by reference number with sanitized venue and breakdown', async () => {
      if (!createdQuoteNumber) return;

      const quote = await getQuote(createdQuoteNumber);
      expect(quote).toBeDefined();
      expect(quote?.quoteNumber).toBe(createdQuoteNumber);
      expect(quote?.customerName).toBe('Aarav Sharma');
      expect(quote?.hall).toBeDefined();
      expect(quote?.hall.name).toBe(testHall.name);

      // Verify no manager contact exists in retrieved quote hall
      expect((quote?.hall as any).manager).toBeUndefined();
      expect((quote?.hall as any).phone).toBeUndefined();
      expect((quote?.hall as any).email).toBeUndefined();
      expect(quote?.breakdown).toBeDefined();
      expect(quote?.breakdown.totalEstimatedAmount).toBeGreaterThan(0);
    });
  });

  describe('7. Quote Status Transition Workflow', () => {
    it('updates quote status accurately', async () => {
      if (!createdQuoteId) return;

      const updated = await updateQuoteStatus(createdQuoteId, 'ACCEPTED', 'Customer accepted terms');
      expect(updated.status).toBe('ACCEPTED');
      expect(updated.notes).toBe('Customer accepted terms');
    });
  });

  describe('8. Venue Comparison Data Model & Spec Sanitization', () => {
    it('formats comparison matrices without exposing venue manager contacts', async () => {
      const halls = await prisma.hall.findMany({
        take: 3,
        include: {
          city: true,
          locality: true,
          pricingRule: true,
          media: { take: 1 },
          manager: { include: { user: true } },
        },
      });

      const sanitizedList = halls.map(sanitizeHallData);

      for (const item of sanitizedList) {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.city).toBeDefined();
        expect((item as any).manager).toBeUndefined();
        expect((item as any).managerId).toBeUndefined();
        expect((item as any).phone).toBeUndefined();
        expect((item as any).email).toBeUndefined();
        expect(JSON.stringify(item)).not.toContain('password');
      }
    });
  });
});
