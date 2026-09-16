import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, setAuthCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/services/auditService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        managerProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Your account has been suspended by an administrator.' }, { status: 403 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (user.role === 'CUSTOMER' && !user.isEmailVerified) {
      return NextResponse.json(
        {
          error: 'Your email address has not been verified. Please verify your account with OTP.',
          needVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    let parsedPermissions: string[] = [];
    if (user.adminProfile?.permissions) {
      try {
        parsedPermissions = JSON.parse(user.adminProfile.permissions);
      } catch {
        parsedPermissions = [];
      }
    }

    const session = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as any,
      managerProfileId: user.managerProfile?.id || null,
      adminRole: user.adminProfile?.adminRole as any || null,
      permissions: parsedPermissions,
    };

    await setAuthCookie(session);

    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actorEmail: user.email,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        managerProfile: user.managerProfile,
        adminProfile: user.adminProfile
          ? {
              adminRole: user.adminProfile.adminRole,
              permissions: parsedPermissions,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
