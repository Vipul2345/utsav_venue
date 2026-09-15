import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/auditService';
import { createNotification } from '@/lib/services/notificationService';

export async function GET() {
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

    const halls = await prisma.hall.findMany({
      where: { managerId: managerProfile.id },
      include: {
        city: true,
        locality: true,
        media: { orderBy: { displayOrder: 'asc' } },
        pricingRule: true,
        occasions: {
          include: { occasion: true },
        },
        amenities: {
          include: { amenity: true },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ halls, managerProfile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch manager halls' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    if (managerProfile.verificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Your manager account is pending administrative verification. You will be notified once verified.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      cityId,
      localityId,
      address,
      contactPhone,
      contactEmail,
      minCapacity,
      maxCapacity,
      indoorAreaSqFt,
      outdoorAreaSqFt,
      hasParking = true,
      parkingCapacity,
      roomsCount = 2,
      baseRentalPrice,
      weekendMultiplier = 1.15,
      cleaningFee = 2000,
      securityDeposit = 10000,
      taxRatePercent = 18.0,
      perPlateVegPrice = 650,
      perPlateNonVegPrice = 850,
      occasionIds = [],
      amenityIds = [],
      mediaUrls = [],
      alcoholAllowed = false,
      outsideCateringAllowed = false,
      outsideDecorAllowed = false,
      cancellationDeadlineHours = 72,
      refundPercentage = 80,
    } = body;

    if (!name || !description || !cityId || !address || !minCapacity || !maxCapacity || !baseRentalPrice) {
      return NextResponse.json({ error: 'Please provide all mandatory hall details and pricing.' }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const hall = await prisma.hall.create({
      data: {
        managerId: managerProfile.id,
        name: name.trim(),
        slug,
        description: description.trim(),
        cityId,
        localityId: localityId || null,
        address: address.trim(),
        contactPhone: contactPhone?.trim() || managerProfile.phone,
        contactEmail: contactEmail?.trim() || session.email,
        minCapacity: parseInt(minCapacity, 10),
        maxCapacity: parseInt(maxCapacity, 10),
        indoorAreaSqFt: indoorAreaSqFt ? parseInt(indoorAreaSqFt, 10) : null,
        outdoorAreaSqFt: outdoorAreaSqFt ? parseInt(outdoorAreaSqFt, 10) : null,
        hasParking: Boolean(hasParking),
        parkingCapacity: parkingCapacity ? parseInt(parkingCapacity, 10) : null,
        roomsCount: parseInt(roomsCount, 10),
        status: 'PENDING_APPROVAL', // Strict publishing lifecycle: must be reviewed and approved by Admin!
        alcoholAllowed: Boolean(alcoholAllowed),
        outsideCateringAllowed: Boolean(outsideCateringAllowed),
        outsideDecorAllowed: Boolean(outsideDecorAllowed),
        cancellationDeadlineHours: parseInt(cancellationDeadlineHours, 10),
        refundPercentage: parseFloat(refundPercentage),
        pricingRule: {
          create: {
            baseRentalPrice: parseFloat(baseRentalPrice),
            weekendMultiplier: parseFloat(weekendMultiplier),
            cleaningFee: parseFloat(cleaningFee),
            securityDeposit: parseFloat(securityDeposit),
            taxRatePercent: parseFloat(taxRatePercent),
            perPlateVegPrice: parseFloat(perPlateVegPrice),
            perPlateNonVegPrice: parseFloat(perPlateNonVegPrice),
          },
        },
        occasions: {
          create: occasionIds.map((occId: string) => ({
            occasionId: occId,
            status: 'PENDING', // Each occasion requires independent admin approval!
          })),
        },
        amenities: {
          create: amenityIds.map((amenId: string) => ({
            amenityId: amenId,
            isComplimentary: true,
          })),
        },
        media: {
          create: mediaUrls.map((url: string, index: number) => ({
            url,
            isCover: index === 0,
            displayOrder: index,
          })),
        },
      },
      include: {
        pricingRule: true,
        occasions: true,
        media: true,
      },
    });

    // Notify administrators
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: 'New Venue Submitted for Approval',
        message: `${hall.name} has been submitted by ${managerProfile.businessName} and is awaiting review.`,
        type: 'APPROVAL',
        link: '/admin/halls',
      });
    }

    // Log audit
    await createAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: 'HALL_CREATED_PENDING_APPROVAL',
      entityType: 'HALL',
      entityId: hall.id,
      details: { name: hall.name, managerId: managerProfile.id },
    });

    return NextResponse.json({ success: true, hall });
  } catch (error: any) {
    console.error('Hall creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create hall' }, { status: 500 });
  }
}
