import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, setAuthCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/services/auditService';
import { createNotification } from '@/lib/services/notificationService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, phone, role = 'CUSTOMER', businessName, city, address, registrationNumber, taxId } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields: email, password, and fullName are mandatory.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const assignedRole = role === 'MANAGER' ? 'MANAGER' : 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        role: assignedRole,
        managerProfile:
          assignedRole === 'MANAGER'
            ? {
                create: {
                  businessName: businessName?.trim() || `${fullName}'s Hospitality`,
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

    // Notify admins about new manager registration if applicable
    if (assignedRole === 'MANAGER') {
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
    }

    // Set auth cookie session
    const session = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as any,
      managerProfileId: user.managerProfile?.id || null,
    };

    await setAuthCookie(session);

    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actorEmail: user.email,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      details: { role: user.role },
    });

    return NextResponse.json({
      success: true,
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
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
