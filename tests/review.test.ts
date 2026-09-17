import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import prisma from '../lib/prisma';

let mockSession: any = null;
vi.mock('../lib/auth', async () => {
  const actual = await vi.importActual<any>('../lib/auth');
  return {
    ...actual,
    getSession: vi.fn(() => Promise.resolve(mockSession)),
  };
});

import { POST, GET } from '../app/api/reviews/route';

describe('Customer Ratings & Verified Reviews Security Suite', () => {
  let customerA: any;
  let customerB: any;
  let managerUser: any;
  let adminUser: any;
  let testHall1: any;
  let testHall2: any;
  let validBookingA: any;
  let validBookingB: any;
  let cancelledBookingA: any;
  let pendingBookingA: any;

  beforeAll(async () => {
    // Find or create test users
    customerA = await prisma.user.upsert({
      where: { email: 'review.custA@example.com' },
      update: {},
      create: {
        email: 'review.custA@example.com',
        fullName: 'Reviewer Alice',
        passwordHash: 'hashed_pw',
        phone: '9876543201',
        role: 'CUSTOMER',
      },
    });

    customerB = await prisma.user.upsert({
      where: { email: 'review.custB@example.com' },
      update: {},
      create: {
        email: 'review.custB@example.com',
        fullName: 'Reviewer Bob',
        passwordHash: 'hashed_pw',
        phone: '9876543202',
        role: 'CUSTOMER',
      },
    });

    managerUser = await prisma.user.findFirst({
      where: { role: 'MANAGER' },
    });

    adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    // Find two distinct halls
    const halls = await prisma.hall.findMany({
      where: { status: 'APPROVED' },
      take: 2,
    });
    testHall1 = halls[0];
    testHall2 = halls[1];

    // Find an occasion
    const occasion = await prisma.occasion.findFirst();

    // Create a confirmed booking for Customer A on Hall 1
    validBookingA = await prisma.booking.create({
      data: {
        bookingNumber: 'BK-TEST-REV-A1',
        hallId: testHall1.id,
        customerId: customerA.id,
        occasionId: occasion?.id,
        eventDate: '2026-05-10',
        startTime: '10:00',
        endTime: '16:00',
        guestCount: 100,
        status: 'CONFIRMED',
        totalAmount: 50000,
      },
    });

    // Create a confirmed booking for Customer B on Hall 1
    validBookingB = await prisma.booking.create({
      data: {
        bookingNumber: 'BK-TEST-REV-B1',
        hallId: testHall1.id,
        customerId: customerB.id,
        occasionId: occasion?.id,
        eventDate: '2026-05-12',
        startTime: '10:00',
        endTime: '16:00',
        guestCount: 100,
        status: 'CONFIRMED',
        totalAmount: 50000,
      },
    });

    // Create a cancelled booking for Customer A
    cancelledBookingA = await prisma.booking.create({
      data: {
        bookingNumber: 'BK-TEST-REV-CANC',
        hallId: testHall1.id,
        customerId: customerA.id,
        occasionId: occasion?.id,
        eventDate: '2026-05-15',
        startTime: '10:00',
        endTime: '16:00',
        guestCount: 100,
        status: 'CANCELLED',
        totalAmount: 50000,
      },
    });

    // Create an unpaid pending booking for Customer A
    pendingBookingA = await prisma.booking.create({
      data: {
        bookingNumber: 'BK-TEST-REV-PEND',
        hallId: testHall1.id,
        customerId: customerA.id,
        occasionId: occasion?.id,
        eventDate: '2026-05-18',
        startTime: '10:00',
        endTime: '16:00',
        guestCount: 100,
        status: 'PAYMENT_PENDING',
        totalAmount: 50000,
      },
    });
  });

  afterAll(async () => {
    // Clean up created reviews and bookings
    await prisma.review.deleteMany({
      where: {
        bookingId: {
          in: [validBookingA.id, validBookingB.id, cancelledBookingA.id, pendingBookingA.id],
        },
      },
    });

    await prisma.booking.deleteMany({
      where: {
        id: {
          in: [validBookingA.id, validBookingB.id, cancelledBookingA.id, pendingBookingA.id],
        },
      },
    });

    await prisma.$disconnect();
  });

  /* =========================================================================
   * 1. AUTHENTICATION & ROLE CHECKS
   * ========================================================================= */
  it('1. Rejects unauthenticated review submissions with 401', async () => {
    mockSession = null;
    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: validBookingA.id,
        rating: 5,
        content: 'Lovely venue and stage.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('2. Rejects manager review submissions with 403 (only customers can review)', async () => {
    mockSession = {
      userId: managerUser ? managerUser.id : 'mgr-user-id',
      email: managerUser ? managerUser.email : 'manager@example.com',
      role: 'MANAGER',
    };

    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: validBookingA.id,
        rating: 5,
        content: 'Manager rating venue.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/only.*customer/i);
  });

  it('3. Rejects admin review submissions with 403', async () => {
    mockSession = {
      userId: adminUser ? adminUser.id : 'admin-user-id',
      email: adminUser ? adminUser.email : 'admin@example.com',
      role: 'ADMIN',
    };

    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: validBookingA.id,
        rating: 5,
        content: 'Admin rating venue.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  /* =========================================================================
   * 2. CROSS-ATTACK PREVENTION & SECURITY BOUNDARIES
   * ========================================================================= */
  it('4. Cross-Customer Attack: Customer A cannot review Customer B booking', async () => {
    mockSession = {
      userId: customerA.id,
      email: customerA.email,
      role: 'CUSTOMER',
    };

    // Attempting to review Customer B's booking
    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: validBookingB.id,
        rating: 5,
        content: 'Trying to hijack another user booking review.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/own verified bookings/i);
  });

  it('5. Cross-Venue Attack: Customer cannot review Venue B using booking from Venue A', async () => {
    mockSession = {
      userId: customerA.id,
      email: customerA.email,
      role: 'CUSTOMER',
    };

    // validBookingA belongs to testHall1, but caller claims hallId is testHall2
    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: validBookingA.id,
        hallId: testHall2.id,
        rating: 5,
        content: 'Attempting cross-venue spoofing.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/does not belong to the requested venue/i);
  });

  /* =========================================================================
   * 3. BOOKING STATUS & ELIGIBILITY RULES
   * ========================================================================= */
  it('6. Rejects reviews on CANCELLED bookings with 400', async () => {
    mockSession = {
      userId: customerA.id,
      email: customerA.email,
      role: 'CUSTOMER',
    };

    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: cancelledBookingA.id,
        rating: 1,
        content: 'Cancelled my booking, want to complain.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/cannot be submitted for cancelled/i);
  });

  it('7. Rejects reviews on PAYMENT_PENDING bookings with 400', async () => {
    mockSession = {
      userId: customerA.id,
      email: customerA.email,
      role: 'CUSTOMER',
    };

    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: pendingBookingA.id,
        rating: 4,
        content: 'Unpaid hold booking.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  /* =========================================================================
   * 4. INPUT VALIDATION (RATING & CONTENT)
   * ========================================================================= */
  it('8. Rejects invalid star ratings (e.g. 0 or 6)', async () => {
    mockSession = {
      userId: customerA.id,
      email: customerA.email,
      role: 'CUSTOMER',
    };

    const req0 = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: validBookingA.id,
        rating: 0,
        content: 'Zero stars.',
      }),
    });
    expect((await POST(req0)).status).toBe(400);

    const req6 = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: validBookingA.id,
        rating: 6,
        content: 'Six stars.',
      }),
    });
    expect((await POST(req6)).status).toBe(400);
  });

  it('9. Rejects empty or whitespace-only review content', async () => {
    mockSession = {
      userId: customerA.id,
      email: customerA.email,
      role: 'CUSTOMER',
    };

    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: validBookingA.id,
        rating: 5,
        content: '   ',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  /* =========================================================================
   * 5. SUCCESSFUL REVIEW SUBMISSION & RATING RECALCULATION
   * ========================================================================= */
  it('10. Allows verified customer to successfully submit review for their confirmed booking', async () => {
    mockSession = {
      userId: customerA.id,
      email: customerA.email,
      role: 'CUSTOMER',
    };

    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: validBookingA.id,
        hallId: testHall1.id,
        rating: 5,
        title: 'Outstanding Banquet Hall',
        content: 'The AC was great, parking was spacious, and the manager was very cooperative.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.review.rating).toBe(5);
    expect(data.review.bookingId).toBe(validBookingA.id);
    expect(data.averageRating).toBeGreaterThan(0);
    expect(data.reviewCount).toBeGreaterThanOrEqual(1);

    // Verify in database
    const saved = await prisma.review.findUnique({
      where: { bookingId: validBookingA.id },
    });
    expect(saved).toBeDefined();
    expect(saved?.content).toBe('The AC was great, parking was spacious, and the manager was very cooperative.');
  });

  /* =========================================================================
   * 6. ENFORCE ONE REVIEW PER BOOKING (DUPLICATE PREVENTION)
   * ========================================================================= */
  it('11. Rejects duplicate review submission for the same booking with 409', async () => {
    mockSession = {
      userId: customerA.id,
      email: customerA.email,
      role: 'CUSTOMER',
    };

    // Attempting second review on validBookingA
    const req = new Request('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: validBookingA.id,
        hallId: testHall1.id,
        rating: 4,
        content: 'Submitting a second review on the same booking.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/already submitted a review/i);
  });

  /* =========================================================================
   * 7. GET /api/reviews QUERY & ELIGIBILITY VERIFICATION
   * ========================================================================= */
  it('12. GET /api/reviews returns approved reviews and recognizes eligible unreviewed bookings', async () => {
    // As Customer B who has validBookingB (not yet reviewed) on testHall1
    mockSession = {
      userId: customerB.id,
      email: customerB.email,
      role: 'CUSTOMER',
    };

    const req = new Request(`http://localhost/api/reviews?hallId=${testHall1.id}`, {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reviews.length).toBeGreaterThanOrEqual(1);
    // Customer B should have eligibleBooking detected
    expect(data.eligibleBooking).toBeDefined();
    expect(data.eligibleBooking?.id).toBe(validBookingB.id);

    // As Customer A who already reviewed validBookingA
    mockSession = {
      userId: customerA.id,
      email: customerA.email,
      role: 'CUSTOMER',
    };

    const resA = await GET(req);
    const dataA = await resA.json();
    // Customer A has no more unreviewed bookings on testHall1
    expect(dataA.eligibleBooking).toBeNull();
  });
});
