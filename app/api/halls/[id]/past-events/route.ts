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

    const pastEvents = await prisma.pastEventMedia.findMany({
      where: { hallId: hall.id },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ pastEvents });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve past event media' },
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

    // Role check: Only the venue manager or an admin can manage past event media
    const isOwnerManager = session.role === 'MANAGER' && hall.manager.userId === session.userId;
    const isAdmin = session.role === 'ADMIN';

    if (!isOwnerManager && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only the venue manager or an admin can manage past event media' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { url, mediaType = 'IMAGE', title, category, caption, displayOrder = 0, thumbnailUrl } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid media URL is required' }, { status: 400 });
    }

    const validTypes = ['IMAGE', 'VIDEO'];
    if (!validTypes.includes(mediaType.toUpperCase())) {
      return NextResponse.json({ error: 'mediaType must be IMAGE or VIDEO' }, { status: 400 });
    }

    const created = await prisma.pastEventMedia.create({
      data: {
        hallId: hall.id,
        url: url.trim(),
        mediaType: mediaType.toUpperCase(),
        thumbnailUrl: thumbnailUrl || null,
        title: title ? String(title).trim() : null,
        category: category ? String(category).trim() : 'General',
        caption: caption ? String(caption).trim() : null,
        displayOrder: Number(displayOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, media: created }, { status: 201 });
  } catch (error: any) {
    console.error('Past events POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add past event media' },
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
    const mediaId = searchParams.get('mediaId');

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId query param is required' }, { status: 400 });
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

    await prisma.pastEventMedia.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ success: true, message: 'Past event media deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete past event media' },
      { status: 500 }
    );
  }
}
