import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import prisma from '../lib/prisma';
import {
  buildOtpEmailPayload,
  buildBookingConfirmationPayload,
  sendOtpEmail,
  sendBookingConfirmationEmail,
  setResendClient,
  resetResendClient,
} from '../lib/email';
import { createBookingWithLock, confirmBookingPayment } from '../lib/services/bookingService';

describe('Transactional Email Engine & Observability Suite', () => {
  let testHall: any;
  let testOccasion: any;
  let testCustomer: any;

  beforeAll(async () => {
    testHall = await prisma.hall.findFirst({
      where: { status: 'APPROVED' },
      include: { pricingRule: true },
    });

    testOccasion = await prisma.occasion.findFirst({
      where: { slug: 'wedding' },
    });

    testCustomer = await prisma.user.upsert({
      where: { email: 'delivered@resend.dev' },
      update: { isActive: true },
      create: {
        email: 'delivered@resend.dev',
        fullName: 'Aarav Sharma',
        phone: '+919876500000',
        passwordHash: 'dummy_hash_for_testing',
        role: 'CUSTOMER',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    resetResendClient();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    resetResendClient();
    if (testCustomer?.id) {
      await prisma.payment.deleteMany({ where: { booking: { customerId: testCustomer.id } } });
      await prisma.booking.deleteMany({ where: { customerId: testCustomer.id } });
    }
  });

  /* =========================================================================
   * 1. TEMPLATE GENERATION & PAYLOAD INTEGRITY
   * ========================================================================= */
  describe('1. Email Template & Content Generation', () => {
    it('builds OTP email payload with correct recipient, code in subject, and HTML expiry notice', () => {
      const recipient = 'delivered@resend.dev';
      const otpCode = '749201';

      const payload = buildOtpEmailPayload(recipient, otpCode);

      expect(payload.to).toBe(recipient);
      expect(payload.from).toBe('Utsav Venues <onboarding@resend.dev>');
      expect(payload.subject).toContain(otpCode);
      expect(payload.subject).toContain('Your Verification Code');
      expect(payload.html).toContain(otpCode);
      expect(payload.html).toContain('10 minutes');
      expect(payload.html).toContain('Utsav Venues Verification');
    });

    it('builds booking confirmation payload with itemized pricing, reference, and guarantee badge', () => {
      const payload = buildBookingConfirmationPayload({
        to: 'delivered@resend.dev',
        customerName: 'Priya Patel',
        bookingNumber: 'BK-2026-994411',
        hallName: 'The Royal Kohinoor Palace',
        eventDate: '2026-12-15',
        timeSlot: '17:00 - 23:00',
        guestCount: 450,
        totalAmount: 385000,
      });

      expect(payload.to).toBe('delivered@resend.dev');
      expect(payload.from).toBe('Utsav Venues <onboarding@resend.dev>');
      expect(payload.subject).toContain('BK-2026-994411');
      expect(payload.subject).toContain('The Royal Kohinoor Palace');
      expect(payload.html).toContain('Priya Patel');
      expect(payload.html).toContain('BK-2026-994411');
      expect(payload.html).toContain('2026-12-15');
      expect(payload.html).toContain('17:00 - 23:00');
      expect(payload.html).toContain('450 Guests');
      expect(payload.html).toContain('3,85,000');
      expect(payload.html).toContain('No Surprise Charges Guarantee');
    });
  });

  /* =========================================================================
   * 2. RESEND SUCCESS & ERROR OBSERVABILITY (4xx / 5xx / NETWORK)
   * ========================================================================= */
  describe('2. Delivery Result Handling & Failure Observability', () => {
    it('handles successful email delivery without throwing', async () => {
      const mockClient = {
        emails: {
          send: async (payload: any) => ({
            data: { id: 'msg_test_success_12345' },
            error: null,
          }),
        },
      };
      setResendClient(mockClient);

      const result = await sendOtpEmail('delivered@resend.dev', '883311');
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_test_success_12345');
      expect(result.error).toBeUndefined();
    });

    it('observes and captures Resend 422 client validation errors without crashing', async () => {
      const mockClient = {
        emails: {
          send: async () => ({
            data: null,
            error: {
              statusCode: 422,
              name: 'validation_error',
              message: 'Invalid `to` field. Testing domain restriction.',
            },
          }),
        },
      };
      setResendClient(mockClient);

      const result = await sendOtpEmail('invalid@unknown-domain.com', '123456');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.statusCode).toBe(422);
      expect(result.error?.name).toBe('validation_error');
      expect(result.error?.message).toContain('Invalid `to` field');
    });

    it('observes and captures Resend 500 upstream server failures', async () => {
      const mockClient = {
        emails: {
          send: async () => ({
            data: null,
            error: {
              statusCode: 500,
              name: 'internal_server_error',
              message: 'Resend API service unavailable.',
            },
          }),
        },
      };
      setResendClient(mockClient);

      const result = await sendBookingConfirmationEmail({
        to: 'delivered@resend.dev',
        customerName: 'Test Customer',
        bookingNumber: 'BK-500-ERR',
        hallName: 'Test Hall',
        eventDate: '2026-10-10',
        timeSlot: '10:00 - 14:00',
        guestCount: 100,
        totalAmount: 50000,
      });

      expect(result.success).toBe(false);
      expect(result.error?.statusCode).toBe(500);
      expect(result.error?.message).toContain('service unavailable');
    });

    it('gracefully captures unexpected network exceptions/rejections', async () => {
      const mockClient = {
        emails: {
          send: async () => {
            throw new Error('ECONNREFUSED - Connection to api.resend.com timed out');
          },
        },
      };
      setResendClient(mockClient);

      const result = await sendOtpEmail('delivered@resend.dev', '999999');
      expect(result.success).toBe(false);
      expect(result.error?.name).toBe('NetworkError');
      expect(result.error?.message).toContain('ECONNREFUSED');
    });
  });

  /* =========================================================================
   * 3. NON-BLOCKING RESILIENCY: EMAIL FAILURE DOES NOT CORRUPT BOOKING
   * ========================================================================= */
  describe('3. Non-Blocking Booking Confirmation Resiliency', () => {
    it('confirms booking and persists payment even if Resend encounters an outage or error', async () => {
      if (!testHall || !testOccasion) return;

      // Mock a complete Resend API failure
      const mockFailingClient = {
        emails: {
          send: async () => {
            throw new Error('Resend upstream 503 Service Unavailable outage');
          },
        },
      };
      setResendClient(mockFailingClient);

      // Create booking hold
      const booking = await createBookingWithLock({
        hallId: testHall.id,
        customerId: testCustomer.id,
        occasionId: testOccasion.id,
        eventDate: '2026-12-28',
        startTime: '10:00',
        endTime: '16:00',
        guestCount: 200,
        cateringType: 'NONE',
      });

      expect(booking.status).toBe('PAYMENT_PENDING');

      // Confirm payment with waitForEmail: true
      const confirmed = await confirmBookingPayment({
        bookingId: booking.id,
        amount: 50000,
        providerTransactionId: 'TXN-OUTAGE-TEST-1',
        waitForEmail: true,
      });

      // 1. The booking MUST still be confirmed in DB despite email outage!
      expect(confirmed.status).toBe('CONFIRMED');
      expect(confirmed.holdExpiresAt).toBeNull();

      const inDb = await prisma.booking.findUnique({ where: { id: booking.id } });
      expect(inDb?.status).toBe('CONFIRMED');

      // 2. The payment record MUST be recorded in DB
      const paymentRecord = await prisma.payment.findFirst({ where: { bookingId: booking.id } });
      expect(paymentRecord).toBeDefined();
      expect(paymentRecord?.status).toBe('SUCCESS');

      // 3. The email failure MUST be observable via emailDeliveryPromise
      const emailResult = await (confirmed as any).emailDeliveryPromise;
      expect(emailResult).toBeDefined();
      expect(emailResult.success).toBe(false);
      expect(emailResult.error?.message).toContain('503 Service Unavailable');

      // Clean up test booking
      await prisma.payment.deleteMany({ where: { bookingId: booking.id } });
      await prisma.bookingItem.deleteMany({ where: { bookingId: booking.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
    });
  });

  /* =========================================================================
   * 4. IDEMPOTENCY & DUPLICATE CONFIRMATION EMAIL PREVENTION
   * ========================================================================= */
  describe('4. Idempotency & Duplicate Email Prevention', () => {
    it('dispatches confirmation email exactly once, even if confirmation endpoint is called repeatedly', async () => {
      if (!testHall || !testOccasion) return;

      let emailSendCount = 0;
      let lastSentRecipient = '';
      let lastSentSubject = '';

      const mockTrackingClient = {
        emails: {
          send: async (payload: any) => {
            emailSendCount++;
            lastSentRecipient = payload.to;
            lastSentSubject = payload.subject;
            return { data: { id: `msg_track_${emailSendCount}` }, error: null };
          },
        },
      };
      setResendClient(mockTrackingClient);

      // Create a booking in PAYMENT_PENDING
      const booking = await createBookingWithLock({
        hallId: testHall.id,
        customerId: testCustomer.id,
        occasionId: testOccasion.id,
        eventDate: '2026-12-29',
        startTime: '16:00',
        endTime: '22:00',
        guestCount: 250,
        cateringType: 'NONE',
      });

      // Call 1: First payment confirmation
      const res1 = await confirmBookingPayment({
        bookingId: booking.id,
        amount: 60000,
        providerTransactionId: 'TXN-IDEMPOTENT-1',
        waitForEmail: true,
      });
      expect(res1.status).toBe('CONFIRMED');
      expect(emailSendCount).toBe(1);
      expect(lastSentRecipient).toBe('delivered@resend.dev');
      expect(lastSentSubject).toContain(booking.bookingNumber);

      // Call 2: User refreshes page or gateway webhook retries
      const res2 = await confirmBookingPayment({
        bookingId: booking.id,
        amount: 60000,
        providerTransactionId: 'TXN-IDEMPOTENT-1',
        waitForEmail: true,
      });
      expect(res2.status).toBe('CONFIRMED');
      // Must NOT send duplicate email!
      expect(emailSendCount).toBe(1);

      // Call 3: Another retry attempt
      const res3 = await confirmBookingPayment({
        bookingId: booking.id,
        amount: 60000,
        providerTransactionId: 'TXN-IDEMPOTENT-1',
        waitForEmail: true,
      });
      expect(res3.status).toBe('CONFIRMED');
      expect(emailSendCount).toBe(1);

      // Clean up test booking
      await prisma.payment.deleteMany({ where: { bookingId: booking.id } });
      await prisma.bookingItem.deleteMany({ where: { bookingId: booking.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
    });
  });
});
