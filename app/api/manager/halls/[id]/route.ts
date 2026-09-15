import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/auditService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
    }

    const { id } = await params;
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!managerProfile) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    const hall = await prisma.hall.findFirst({
      where: {
        id,
        managerId: managerProfile.id, // Isolation: Manager A cannot view Manager B's halls!
      },
      include: {
        city: true,
        locality: true,
        media: { orderBy: { displayOrder: 'asc' } },
        pricingRule: true,
        addons: true,
        occasions: {
          include: { occasion: true },
        },
        amenities: {
          include: { amenity: true },
        },
        availabilityBlocks: true,
      },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ hall });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve hall' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
    }

    const { id } = await params;
    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!managerProfile) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    const hall = await prisma.hall.findFirst({
      where: { id, managerId: managerProfile.id },
      include: { pricingRule: true },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      minCapacity,
      maxCapacity,
      baseRentalPrice,
      alcoholAllowed,
      outsideCateringAllowed,
      outsideDecorAllowed,
      cancellationDeadlineHours,
      refundPercentage,
    } = body;

    // Notice: if major capacity or pricing changes occur, keep track
    const updatedHall = await prisma.hall.update({
      where: { id: hall.id },
      data: {
        name: name !== undefined ? name : hall.name,
        description: description !== undefined ? description : hall.description,
        minCapacity: minCapacity !== undefined ? parseInt(minCapacity, 10) : hall.minCapacity,
        maxCapacity: maxCapacity !== undefined ? parseInt(maxCapacity, 10) : hall.maxCapacity,
        alcoholAllowed: alcoholAllowed !== undefined ? Boolean(alcoholAllowed) : hall.alcoholAllowed,
        outsideCateringAllowed: outsideCateringAllowed !== undefined ? Boolean(outsideCateringAllowed) : hall.outsideCateringAllowed,
        outsideDecorAllowed: outsideDecorAllowed !== undefined ? Boolean(outsideDecorAllowed) : hall.outsideDecorAllowed,
        cancellationDeadlineHours: cancellationDeadlineHours !== undefined ? parseInt(cancellationDeadlineHours, 10) : hall.cancellationDeadlineHours,
        refundPercentage: refundPercentage !== undefined ? parseFloat(refundPercentage) : hall.refundPercentage,
      },
    });

    if (baseRentalPrice !== undefined && hall.pricingRule) {
      await prisma.pricingRule.update({
        where: { id: hall.pricingRule.id },
        data: { baseRentalPrice: parseFloat(baseRentalPrice) },
      });
    }

    await createAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: 'HALL_UPDATED',
      entityType: 'HALL',
      entityId: hall.id,
      details: { changes: body },
    });

    return NextResponse.json({ success: true, hall: updatedHall });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update hall' }, { status: 500 });
  }
}
