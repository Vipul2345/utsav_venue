import { NextResponse } from 'next/server';
import { getSession, clearAuthCookie } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        managerProfile: true,
        adminProfile: true,
      },
    });

    if (!user || !user.isActive) {
      await clearAuthCookie();
      return NextResponse.json({ user: null });
    }

    let parsedPermissions: string[] = [];
    if (user.adminProfile?.permissions) {
      try {
        parsedPermissions = JSON.parse(user.adminProfile.permissions);
      } catch {
        parsedPermissions = [];
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
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
    return NextResponse.json({ user: null });
  }
}

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
