import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyEmailOtp } from '@/lib/services/otpService';
import { setAuthCookie } from '@/lib/auth';
import { isValidEmail } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, otp, purpose = 'REGISTRATION' } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }

    const verifyResult = await verifyEmailOtp(email, otp, purpose);

    if (!verifyResult.valid) {
      return NextResponse.json(
        {
          error: verifyResult.error,
          remainingAttempts: verifyResult.remainingAttempts,
        },
        { status: 400 }
      );
    }

    // OTP is valid! Mark user as verified
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { managerProfile: true, adminProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User account not found for this email address.' },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
      include: { managerProfile: true, adminProfile: true },
    });

    // Establish authenticated session
    await setAuthCookie({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role as any,
      fullName: updatedUser.fullName,
      managerProfileId: updatedUser.managerProfile?.id || null,
      adminRole: (updatedUser.adminProfile?.adminRole as any) || null,
      permissions: updatedUser.adminProfile?.permissions
        ? JSON.parse(updatedUser.adminProfile.permissions)
        : [],
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isEmailVerified: true,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
