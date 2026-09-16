import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isValidPhone } from '@/lib/validation';
import { createAuditLog } from '@/lib/services/auditService';

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
    }

    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!managerProfile) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      businessName,
      phone,
      city,
      address,
      taxId,
      businessRegistrationNumber,
      fullName,
    } = body;

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number' }, { status: 400 });
    }

    // Update user record if phone or fullName given
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        fullName: fullName?.trim() || undefined,
        phone: phone ? phone.trim() : undefined,
      },
    });

    // Update ManagerProfile
    const updatedProfile = await prisma.managerProfile.update({
      where: { id: managerProfile.id },
      data: {
        businessName: businessName !== undefined ? businessName.trim() : managerProfile.businessName,
        phone: phone !== undefined ? phone.trim() : managerProfile.phone,
        city: city !== undefined ? city.trim() : managerProfile.city,
        address: address !== undefined ? address.trim() : managerProfile.address,
        taxId: taxId !== undefined ? taxId.trim() : managerProfile.taxId,
        businessRegistrationNumber:
          businessRegistrationNumber !== undefined
            ? businessRegistrationNumber.trim()
            : managerProfile.businessRegistrationNumber,
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phone: true, role: true },
        },
      },
    });

    await createAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: 'MANAGER_PROFILE_UPDATED',
      entityType: 'MANAGER',
      entityId: managerProfile.id,
      details: { changes: body },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update manager profile' }, { status: 500 });
  }
}
