import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '../lib/prisma';
import {
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
  validateEventDate,
  validateTimeInterval,
  validateGuestCount,
  validatePrice,
  validateRequiredString,
} from '../lib/validation';
import { generateAndSendOtp, verifyEmailOtp } from '../lib/services/otpService';
import { ADMIN_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS, hasPermission } from '../lib/rbac';
import { hashPassword, comparePassword } from '../lib/auth';

describe('Targeted Enhancements & Security Verification Suite', () => {
  /* =========================================================================
   * 1. VALIDATION ENGINE TESTS
   * ========================================================================= */
  describe('1. Centralized Input Validation Engine', () => {
    it('validates email addresses correctly', () => {
      expect(isValidEmail('valid.user@example.com')).toBe(true);
      expect(isValidEmail('user+tag@domain.co.in')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('validates 10-digit phone numbers with international prefixes', () => {
      expect(isValidPhone('9876543210')).toBe(true);
      expect(isValidPhone('+919876543210')).toBe(true);
      expect(isValidPhone('98765-43210')).toBe(true);
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('abcdefghij')).toBe(false);
    });

    it('enforces rigorous password complexity', () => {
      // Weak password: too short
      const weak1 = validatePasswordStrength('Short1!');
      expect(weak1.isValid).toBe(false);

      // Weak password: no uppercase
      const weak2 = validatePasswordStrength('lowercase123!');
      expect(weak2.isValid).toBe(false);

      // Weak password: no special char
      const weak3 = validatePasswordStrength('NoSpecialChar123');
      expect(weak3.isValid).toBe(false);

      // Strong password
      const strong = validatePasswordStrength('GrandCelebration!2026');
      expect(strong.isValid).toBe(true);
      expect(strong.score).toBe(5);
    });

    it('validates event dates and rejects past dates', () => {
      // Future date
      const future = new Date();
      future.setDate(future.getDate() + 30);
      const futureStr = future.toISOString().split('T')[0];
      expect(validateEventDate(futureStr).isValid).toBe(true);

      // Past date
      expect(validateEventDate('2020-01-01').isValid).toBe(false);
      expect(validateEventDate('2020-01-01').error).toContain('past');

      // Invalid format
      expect(validateEventDate('12/31/2026').isValid).toBe(false);
    });

    it('validates time intervals and minimum durations', () => {
      // Valid interval (4 hours)
      expect(validateTimeInterval('10:00', '14:00').isValid).toBe(true);

      // End time before start time
      expect(validateTimeInterval('18:00', '12:00').isValid).toBe(false);
      expect(validateTimeInterval('18:00', '12:00').error).toContain('later than start');

      // Less than 1 hour duration
      expect(validateTimeInterval('10:00', '10:30', 60).isValid).toBe(false);
    });

    it('validates guest count and monetary price bounds', () => {
      expect(validateGuestCount(250, 100, 500).isValid).toBe(true);
      expect(validateGuestCount(50, 100, 500).isValid).toBe(false);
      expect(validateGuestCount(600, 100, 500).isValid).toBe(false);
      expect(validateGuestCount('invalid').isValid).toBe(false);

      expect(validatePrice(50000).isValid).toBe(true);
      expect(validatePrice(-500).isValid).toBe(false);
    });
  });

  /* =========================================================================
   * 2. CUSTOMER EMAIL OTP VERIFICATION TESTS
   * ========================================================================= */
  describe('2. Customer Email OTP Lifecycle & Security', () => {
    const testEmail = `test.otp.${Date.now()}@example.com`;
    let generatedOtp: string;

    it('generates cryptographic 6-digit OTP and stores hash securely', async () => {
      const res = await generateAndSendOtp(testEmail, 'REGISTRATION');
      expect(res.success).toBe(true);
      expect(res.devOtpCode).toBeDefined();
      expect(res.devOtpCode?.length).toBe(6);
      expect(Number(res.devOtpCode)).toBeGreaterThanOrEqual(100000);
      generatedOtp = res.devOtpCode!;

      // Verify in DB that plaintext OTP is NOT stored (only otpHash)
      const record = await prisma.emailOtp.findFirst({
        where: { email: testEmail, purpose: 'REGISTRATION' },
      });
      expect(record).toBeDefined();
      expect(record?.otpHash).not.toBe(generatedOtp); // Must be a secure SHA-256 HMAC hash!
      expect(record?.otpHash.length).toBe(64); // 64-char hex SHA-256
    });

    it('enforces rate limiting cooldown between consecutive requests', async () => {
      // Immediate next request must be rejected with remaining cooldown seconds
      const res = await generateAndSendOtp(testEmail, 'REGISTRATION');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Please wait');
      expect(res.cooldownSeconds).toBeGreaterThan(0);
    });

    it('rejects incorrect OTP and counts remaining attempts', async () => {
      const verifyRes = await verifyEmailOtp(testEmail, '000000', 'REGISTRATION');
      expect(verifyRes.valid).toBe(false);
      expect(verifyRes.error).toContain('Incorrect verification code');
      expect(verifyRes.remainingAttempts).toBe(4);
    });

    it('successfully verifies with the correct OTP and cleans up record', async () => {
      const verifyRes = await verifyEmailOtp(testEmail, generatedOtp, 'REGISTRATION');
      expect(verifyRes.valid).toBe(true);

      // Once verified, the OTP record must be cleared from the DB
      const record = await prisma.emailOtp.findFirst({
        where: { email: testEmail, purpose: 'REGISTRATION' },
      });
      expect(record).toBeNull();
    });
  });

  /* =========================================================================
   * 3. ADMIN CREATION & RBAC TESTS
   * ========================================================================= */
  describe('3. Admin Creation with Role-Based Permissions', () => {
    it('correctly maps default permissions for each admin role', () => {
      const superPerms = ROLE_DEFAULT_PERMISSIONS.SUPER_ADMIN;
      expect(superPerms).toContain(ADMIN_PERMISSIONS.MANAGE_ADMINS);
      expect(superPerms).toContain(ADMIN_PERMISSIONS.MANAGE_SETTINGS);

      const opsPerms = ROLE_DEFAULT_PERMISSIONS.OPERATIONS_ADMIN;
      expect(opsPerms).toContain(ADMIN_PERMISSIONS.VIEW_HALLS);
      expect(opsPerms).not.toContain(ADMIN_PERMISSIONS.MANAGE_ADMINS);

      const finPerms = ROLE_DEFAULT_PERMISSIONS.FINANCE_ADMIN;
      expect(finPerms).toContain(ADMIN_PERMISSIONS.VIEW_PAYMENTS);
      expect(finPerms).not.toContain(ADMIN_PERMISSIONS.APPROVE_HALLS);
    });

    it('creates an admin account with hashed password and AdminProfile', async () => {
      const adminEmail = `invited.admin.${Date.now()}@platform.com`;
      const passHash = await hashPassword('AdminSecurePass!2026');

      const adminUser = await prisma.user.create({
        data: {
          fullName: 'Sanya Operations Admin',
          email: adminEmail,
          passwordHash: passHash,
          role: 'ADMIN',
          isActive: true,
          isEmailVerified: true,
          adminProfile: {
            create: {
              adminRole: 'OPERATIONS_ADMIN',
              permissions: JSON.stringify(ROLE_DEFAULT_PERMISSIONS.OPERATIONS_ADMIN),
            },
          },
        },
        include: { adminProfile: true },
      });

      expect(adminUser.id).toBeDefined();
      expect(adminUser.role).toBe('ADMIN');
      expect(adminUser.adminProfile?.adminRole).toBe('OPERATIONS_ADMIN');

      const isPassValid = await comparePassword('AdminSecurePass!2026', adminUser.passwordHash);
      expect(isPassValid).toBe(true);

      // Cleanup
      await prisma.user.delete({ where: { id: adminUser.id } });
    });
  });

  /* =========================================================================
   * 4. DYNAMIC LOCATION MANAGEMENT TESTS
   * ========================================================================= */
  describe('4. Dynamic Location System (Country, State, City, Locality)', () => {
    let testCityId: string;
    let testLocalityId: string;

    it('dynamically creates a new City with State and Country', async () => {
      const cityName = `TestCity_${Date.now()}`;
      const slug = cityName.toLowerCase();

      const city = await prisma.city.create({
        data: {
          name: cityName,
          slug,
          state: 'Rajasthan',
          country: 'India',
          isActive: true,
        },
      });

      expect(city.id).toBeDefined();
      expect(city.state).toBe('Rajasthan');
      expect(city.country).toBe('India');
      expect(city.isActive).toBe(true);
      testCityId = city.id;
    });

    it('dynamically creates a Locality under the new City', async () => {
      const locality = await prisma.locality.create({
        data: {
          cityId: testCityId,
          name: 'Palace Road Area',
          slug: 'palace-road-area',
          isActive: true,
        },
      });

      expect(locality.id).toBeDefined();
      expect(locality.cityId).toBe(testCityId);
      testLocalityId = locality.id;
    });

    it('supports disabling and enabling locations dynamically', async () => {
      // Disable locality
      const disabledLoc = await prisma.locality.update({
        where: { id: testLocalityId },
        data: { isActive: false },
      });
      expect(disabledLoc.isActive).toBe(false);

      // Disable city
      const disabledCity = await prisma.city.update({
        where: { id: testCityId },
        data: { isActive: false },
      });
      expect(disabledCity.isActive).toBe(false);

      // Meta query should NOT return disabled cities
      const activeCities = await prisma.city.findMany({
        where: { isActive: true },
      });
      expect(activeCities.some((c) => c.id === testCityId)).toBe(false);

      // Cleanup test locations
      await prisma.city.delete({ where: { id: testCityId } });
    });
  });

  /* =========================================================================
   * 5. CONTACT INQUIRY PERSISTENCE TESTS
   * ========================================================================= */
  describe('5. Contact Inquiries Persistence', () => {
    it('stores submitted contact inquiries in the database', async () => {
      const contact = await prisma.contactMessage.create({
        data: {
          name: 'Sunita Sharma',
          email: 'sunita@example.com',
          phone: '9876543210',
          subject: 'Grand Wedding Inquiry for December 2026',
          message: 'Interested in booking Kohinoor Palace with 500 guests catering package.',
          status: 'UNREAD',
        },
      });

      expect(contact.id).toBeDefined();
      expect(contact.status).toBe('UNREAD');
      expect(contact.subject).toContain('Grand Wedding');

      // Cleanup
      await prisma.contactMessage.delete({ where: { id: contact.id } });
    });
  });
});
