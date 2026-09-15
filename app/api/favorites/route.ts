import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ favorites: [] });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.userId },
      include: {
        hall: {
          include: {
            city: true,
            locality: true,
            media: { where: { isCover: true } },
            pricingRule: true,
            reviews: { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ favorites });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to save favorites' }, { status: 401 });
    }

    const { hallId } = await request.json();
    if (!hallId) {
      return NextResponse.json({ error: 'hallId is required' }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_hallId: { userId: session.userId, hallId },
      },
    });

    if (existing) {
      // Toggle off (remove)
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ favorited: false });
    } else {
      // Add
      await prisma.favorite.create({
        data: { userId: session.userId, hallId },
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to toggle favorite' }, { status: 500 });
  }
}
