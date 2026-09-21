import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, setAuthCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/services/auditService';
import { createNotification } from '@/lib/services/notificationService';
import { generateAndSendOtp } from '@/lib/services/otpService';
import {
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
  validateRequiredString,
} from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      email,
      password,
      fullName,
      phone,
      role = 'CUSTOMER',
      businessName,
      city,
      address,
      registrationNumber,
      taxId,
    } = body;

    // 1. Mandatory Field Validation
    const nameCheck = validateRequiredString(fullName, 'Full Name', 2, 100);
    if (!nameCheck.isValid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address (e.g. name@example.com).' },
        { status: 400 }
      );
    }

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile phone number.' },
        { status: 400 }
      );
    }

    // 2. Password Strength Validation
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        {
          error: `Password is too weak: ${passwordCheck.feedback.join(', ')}.`,
          feedback: passwordCheck.feedback,
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Duplicate Account Check
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // If user exists and is already verified
      if (existingUser.isEmailVerified) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please log in.' },
          { status: 409 }
        );
      } else {
        // If unverified customer registered earlier, re-send OTP
        const otpResult = await generateAndSendOtp(normalizedEmail, 'REGISTRATION');
        if (!otpResult.success) {
          return NextResponse.json(
            { error: otpResult.error || 'Failed to dispatch verification email.' },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          requireOtp: true,
          email: normalizedEmail,
          message: 'Account exists but is unverified. A new verification OTP has been sent.',
        });
      }
    }

    const passwordHash = await hashPassword(password);
    const assignedRole = role === 'MANAGER' ? 'MANAGER' : 'CUSTOMER';
    const isCustomer = assignedRole === 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : null,
        role: assignedRole,
        isEmailVerified: !isCustomer, // Customers start unverified; managers start verified for email, pending for KYC
        managerProfile:
          assignedRole === 'MANAGER'
            ? {
                create: {
                  businessName: businessName?.trim() || `${fullName.trim()}'s Hospitality`,
                  phone: phone?.trim() || '',
                  city: city || 'Bangalore',
                  address: address || null,
                  businessRegistrationNumber: registrationNumber || null,
                  taxId: taxId || null,
                  verificationStatus: 'PENDING',
                },
              }
            : undefined,
      },
      include: {
        managerProfile: true,
      },
    });

    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actorEmail: user.email,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      details: { role: user.role, isEmailVerified: user.isEmailVerified },
    });

    // CUSTOMER FLOW: Generate OTP & do not issue session cookie until verified
    if (isCustomer) {
      const otpResult = await generateAndSendOtp(user.email, 'REGISTRATION');
      if (!otpResult.success) {
        return NextResponse.json(
          {
            error: otpResult.error || 'Account created, but failed to send verification email. Please check your email or try requesting OTP again.',
            requireOtp: true,
            email: user.email,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        requireOtp: true,
        email: user.email,
        message: 'Account created! Please verify your email with the 6-digit OTP code.',
      });
    }

    // MANAGER FLOW: Notify admins about new manager registration and issue session
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: 'New Manager Verification Request',
        message: `${user.fullName} (${user.managerProfile?.businessName}) has applied for a Hall Manager account.`,
        type: 'APPROVAL',
        link: '/admin/managers',
      });
    }

    // Set auth cookie session for manager
    await setAuthCookie({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as any,
      managerProfileId: user.managerProfile?.id || null,
    });

    return NextResponse.json({
      success: true,
      requireOtp: false,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        managerProfile: user.managerProfile,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed. Please check inputs.' },
      { status: 500 }
    );
  }
}
