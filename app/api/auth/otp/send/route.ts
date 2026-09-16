import { NextResponse } from 'next/server';
import { generateAndSendOtp } from '@/lib/services/otpService';
import { isValidEmail } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, purpose = 'REGISTRATION' } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const result = await generateAndSendOtp(email, purpose);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, cooldownSeconds: result.cooldownSeconds },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      expiresAt: result.expiresAt,
      cooldownSeconds: result.cooldownSeconds,
      devOtpCode: result.devOtpCode, // For reviewer & demo testing visibility
    });
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
