import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/adminAuth';
import { ADMIN_PERMISSIONS } from '@/lib/rbac';
import { createAuditLog } from '@/lib/services/auditService';
import { validateRequiredString } from '@/lib/validation';

export async function GET() {
  try {
    const { errorResponse } = await requireAdminPermission(
      ADMIN_PERMISSIONS.VIEW_HALLS
    );
    if (errorResponse) return errorResponse;

    const cities = await prisma.city.findMany({
      include: {
        localities: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { halls: true },
        },
      },
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ cities });
  } catch (error: any) {
    console.error('Fetch locations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { session, errorResponse } = await requireAdminPermission(
      ADMIN_PERMISSIONS.MANAGE_SETTINGS
    );
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => ({}));
    const { type = 'CITY', name, state, country = 'India', cityId } = body;

    const nameVal = validateRequiredString(name, 'Location Name', 2, 80);
    if (!nameVal.isValid) {
      return NextResponse.json({ error: nameVal.error }, { status: 400 });
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (type === 'CITY') {
      const stateVal = validateRequiredString(state, 'State', 2, 80);
      if (!stateVal.isValid) {
        return NextResponse.json({ error: stateVal.error }, { status: 400 });
      }

      // Check duplicate
      const existing = await prisma.city.findFirst({
        where: {
          OR: [{ name: { equals: trimmedName } }, { slug }],
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: `A city named '${trimmedName}' already exists.` },
          { status: 409 }
        );
      }

      const city = await prisma.city.create({
        data: {
          name: trimmedName,
          slug,
          state: state.trim(),
          country: (country || 'India').trim(),
          isActive: true,
        },
        include: { localities: true },
      });

      await createAuditLog({
        actorId: session.userId,
        actorRole: session.role,
        actorEmail: session.email,
        action: 'LOCATION_CITY_CREATED',
        entityType: 'LOCATION',
        entityId: city.id,
        details: { name: city.name, state: city.state, country: city.country },
      });

      return NextResponse.json({ success: true, city });
    } else if (type === 'LOCALITY') {
      if (!cityId) {
        return NextResponse.json({ error: 'City ID is required to add a locality.' }, { status: 400 });
      }

      const city = await prisma.city.findUnique({ where: { id: cityId } });
      if (!city) {
        return NextResponse.json({ error: 'Selected city does not exist.' }, { status: 404 });
      }

      const localitySlug = `${city.slug}-${slug}`;
      const existing = await prisma.locality.findFirst({
        where: {
          cityId,
          OR: [{ name: { equals: trimmedName } }, { slug: localitySlug }],
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: `Locality '${trimmedName}' already exists in ${city.name}.` },
          { status: 409 }
        );
      }

      const locality = await prisma.locality.create({
        data: {
          cityId,
          name: trimmedName,
          slug: localitySlug,
          isActive: true,
        },
      });

      await createAuditLog({
        actorId: session.userId,
        actorRole: session.role,
        actorEmail: session.email,
        action: 'LOCATION_LOCALITY_CREATED',
        entityType: 'LOCATION',
        entityId: locality.id,
        details: { name: locality.name, cityName: city.name },
      });

      return NextResponse.json({ success: true, locality });
    } else {
      return NextResponse.json({ error: 'Invalid location type. Must be CITY or LOCALITY.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Create location error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create location' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { session, errorResponse } = await requireAdminPermission(
      ADMIN_PERMISSIONS.MANAGE_SETTINGS
    );
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => ({}));
    const { id, type = 'CITY', name, state, country, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Location ID is required.' }, { status: 400 });
    }

    if (type === 'CITY') {
      const dataToUpdate: any = {};
      if (name !== undefined) dataToUpdate.name = name.trim();
      if (state !== undefined) dataToUpdate.state = state.trim();
      if (country !== undefined) dataToUpdate.country = country.trim();
      if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

      const updated = await prisma.city.update({
        where: { id },
        data: dataToUpdate,
        include: { localities: true },
      });

      await createAuditLog({
        actorId: session.userId,
        actorRole: session.role,
        actorEmail: session.email,
        action: 'LOCATION_CITY_UPDATED',
        entityType: 'LOCATION',
        entityId: updated.id,
        details: dataToUpdate,
      });

      return NextResponse.json({ success: true, city: updated });
    } else if (type === 'LOCALITY') {
      const dataToUpdate: any = {};
      if (name !== undefined) dataToUpdate.name = name.trim();
      if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

      const updated = await prisma.locality.update({
        where: { id },
        data: dataToUpdate,
      });

      await createAuditLog({
        actorId: session.userId,
        actorRole: session.role,
        actorEmail: session.email,
        action: 'LOCATION_LOCALITY_UPDATED',
        entityType: 'LOCATION',
        entityId: updated.id,
        details: dataToUpdate,
      });

      return NextResponse.json({ success: true, locality: updated });
    }

    return NextResponse.json({ error: 'Invalid location type' }, { status: 400 });
  } catch (error: any) {
    console.error('Update location error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update location' },
      { status: 500 }
    );
  }
}
