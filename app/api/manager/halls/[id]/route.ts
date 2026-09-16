import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/auditService';
import { getSystemSettings } from '@/lib/settings';

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
      include: { pricingRule: true, media: true },
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
      media,
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

    // Process media additions / modifications / deletions if passed
    if (media !== undefined && Array.isArray(media)) {
      const settings = await getSystemSettings();
      const cleanMedia = media
        .filter((m: any) => m && typeof m.url === 'string' && /^https?:\/\/.+/i.test(m.url.trim()))
        .map((m: any, idx: number) => ({
          id: m.id || undefined,
          url: m.url.trim(),
          caption: m.caption ? m.caption.trim() : null,
          isCover: m.isCover !== undefined ? Boolean(m.isCover) : idx === 0,
          displayOrder: idx,
        }));

      if (cleanMedia.length < 2) {
        return NextResponse.json(
          { error: 'A minimum of 2 valid venue photos is required.' },
          { status: 400 }
        );
      }

      if (cleanMedia.length > settings.maxHallImages) {
        return NextResponse.json(
          { error: `You cannot upload more than ${settings.maxHallImages} photos per listing.` },
          { status: 400 }
        );
      }

      const existingMediaMap = new Map(hall.media.map((m) => [m.id, m]));
      const keptIds = new Set<string>();

      for (const item of cleanMedia) {
        if (item.id && existingMediaMap.has(item.id)) {
          keptIds.add(item.id);
          const existing = existingMediaMap.get(item.id)!;
          const urlChanged = existing.url !== item.url;
          await prisma.hallMedia.update({
            where: { id: item.id },
            data: {
              url: item.url,
              caption: item.caption,
              isCover: item.isCover,
              displayOrder: item.displayOrder,
              // If image URL changed, put back into PENDING verification!
              verificationStatus: urlChanged ? 'PENDING' : existing.verificationStatus,
              rejectionReason: urlChanged ? null : existing.rejectionReason,
            },
          });
        } else {
          // New image added post-listing -> start in PENDING verification
          const created = await prisma.hallMedia.create({
            data: {
              hallId: hall.id,
              url: item.url,
              caption: item.caption,
              isCover: item.isCover,
              displayOrder: item.displayOrder,
              verificationStatus: 'PENDING',
            },
          });
          keptIds.add(created.id);
        }
      }

      // Delete any media removed by manager
      for (const existing of hall.media) {
        if (!keptIds.has(existing.id)) {
          await prisma.hallMedia.delete({
            where: { id: existing.id },
          });
        }
      }
    }

    const finalHall = await prisma.hall.findUnique({
      where: { id: hall.id },
      include: {
        pricingRule: true,
        media: { orderBy: { displayOrder: 'asc' } },
      },
    });

    await createAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: 'HALL_UPDATED',
      entityType: 'HALL',
      entityId: hall.id,
      details: { changes: body },
    });

    return NextResponse.json({ success: true, hall: finalHall });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update hall' }, { status: 500 });
  }
}
