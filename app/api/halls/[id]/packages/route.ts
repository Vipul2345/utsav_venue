import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hall = await prisma.hall.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const packages = await prisma.venuePackage.findMany({
      where: { hallId: hall.id, isActive: true },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json({ packages });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve packages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hall = await prisma.hall.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { manager: true },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const isOwnerManager = session.role === 'MANAGER' && hall.manager.userId === session.userId;
    const isAdmin = session.role === 'ADMIN';

    if (!isOwnerManager && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only venue manager or admin can configure packages' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, description, price, includedServices, minGuests = 50, maxGuests, eventType = 'ALL', isActive = true } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json({ error: 'Valid non-negative price is required' }, { status: 400 });
    }

    const created = await prisma.venuePackage.create({
      data: {
        hallId: hall.id,
        name: name.trim(),
        description: description ? String(description).trim() : null,
        price: numPrice,
        includedServices: includedServices ? (typeof includedServices === 'string' ? includedServices : JSON.stringify(includedServices)) : null,
        minGuests: minGuests ? Number(minGuests) : 50,
        maxGuests: maxGuests ? Number(maxGuests) : null,
        eventType: eventType ? String(eventType).trim() : 'ALL',
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, package: created }, { status: 201 });
  } catch (error: any) {
    console.error('Package POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create package' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hall = await prisma.hall.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { manager: true },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const isOwnerManager = session.role === 'MANAGER' && hall.manager.userId === session.userId;
    const isAdmin = session.role === 'ADMIN';

    if (!isOwnerManager && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { packageId, name, description, price, includedServices, minGuests, maxGuests, isActive } = body;

    if (!packageId) {
      return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
    }

    const updated = await prisma.venuePackage.update({
      where: { id: packageId },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(description !== undefined ? { description: description ? String(description).trim() : null } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(includedServices !== undefined ? { includedServices: typeof includedServices === 'string' ? includedServices : JSON.stringify(includedServices) } : {}),
        ...(minGuests !== undefined ? { minGuests: Number(minGuests) } : {}),
        ...(maxGuests !== undefined ? { maxGuests: Number(maxGuests) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return NextResponse.json({ success: true, package: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update package' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get('packageId');

    if (!packageId) {
      return NextResponse.json({ error: 'packageId query parameter is required' }, { status: 400 });
    }

    const { id } = await params;
    const hall = await prisma.hall.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { manager: true },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const isOwnerManager = session.role === 'MANAGER' && hall.manager.userId === session.userId;
    const isAdmin = session.role === 'ADMIN';

    if (!isOwnerManager && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.venuePackage.delete({
      where: { id: packageId },
    });

    return NextResponse.json({ success: true, message: 'Package deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete package' },
      { status: 500 }
    );
  }
}
