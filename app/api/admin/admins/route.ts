import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/adminAuth';
import { ADMIN_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from '@/lib/rbac';
import { hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/services/auditService';
import {
  isValidEmail,
  validatePasswordStrength,
  validateRequiredString,
} from '@/lib/validation';
import { AdminRoleType } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { session, errorResponse } = await requireAdminPermission(
      ADMIN_PERMISSIONS.VIEW_USERS
    );
    if (errorResponse) return errorResponse;

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      include: {
        adminProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const sanitized = admins.map((a) => {
      let perms: string[] = [];
      try {
        perms = a.adminProfile?.permissions ? JSON.parse(a.adminProfile.permissions) : [];
      } catch {
        perms = [];
      }
      return {
        id: a.id,
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        isActive: a.isActive,
        createdAt: a.createdAt,
        adminProfile: a.adminProfile
          ? {
              id: a.adminProfile.id,
              adminRole: a.adminProfile.adminRole,
              permissions: perms,
            }
          : null,
      };
    });

    return NextResponse.json({ admins: sanitized });
  } catch (error: any) {
    console.error('Fetch admins error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch administrators' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Only Super Admin or admins explicitly equipped with MANAGE_ADMINS can create/invite admins
    const { session, errorResponse } = await requireAdminPermission(
      ADMIN_PERMISSIONS.MANAGE_ADMINS
    );
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => ({}));
    const {
      fullName,
      email,
      phone,
      password,
      adminRole = 'OPERATIONS_ADMIN',
      permissions,
    } = body;

    // Validation
    const nameCheck = validateRequiredString(fullName, 'Admin Full Name', 2, 100);
    if (!nameCheck.isValid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

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

    const validRoles: AdminRoleType[] = [
      'SUPER_ADMIN',
      'OPERATIONS_ADMIN',
      'VERIFICATION_ADMIN',
      'FINANCE_ADMIN',
      'SUPPORT_ADMIN',
    ];

    if (!validRoles.includes(adminRole as AdminRoleType)) {
      return NextResponse.json(
        { error: `Invalid admin role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email address already exists in the system.' },
        { status: 409 }
      );
    }

    // Determine assigned permissions
    let assignedPerms: string[] = [];
    if (Array.isArray(permissions) && permissions.length > 0) {
      assignedPerms = permissions;
    } else {
      assignedPerms = ROLE_DEFAULT_PERMISSIONS[adminRole as AdminRoleType] || [];
    }

    const passwordHash = await hashPassword(password);

    const newAdmin = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : null,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
        adminProfile: {
          create: {
            adminRole,
            permissions: JSON.stringify(assignedPerms),
          },
        },
      },
      include: {
        adminProfile: true,
      },
    });

    // Record audit log
    await createAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: 'ADMIN_CREATED',
      entityType: 'USER',
      entityId: newAdmin.id,
      details: {
        adminName: newAdmin.fullName,
        adminEmail: newAdmin.email,
        adminRole,
        permissionsCount: assignedPerms.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Administrator ${newAdmin.fullName} created successfully with role ${adminRole}.`,
      admin: {
        id: newAdmin.id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role,
        adminRole: newAdmin.adminProfile?.adminRole,
        permissions: assignedPerms,
      },
    });
  } catch (error: any) {
    console.error('Admin creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create administrator account' },
      { status: 500 }
    );
  }
}
