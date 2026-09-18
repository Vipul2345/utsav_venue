import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createQuote, listCustomerQuotes } from '@/lib/services/quoteService';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();

    const {
      hallId,
      customerName,
      customerEmail,
      customerPhone,
      eventType,
      guestCount,
      eventDate,
      slot = 'FULL_DAY',
      packageId,
      selectedAddons,
      specialRequirements,
      notes,
    } = body;

    if (!hallId || !customerName || !customerEmail || !customerPhone || !eventType || !guestCount || !eventDate) {
      return NextResponse.json(
        { error: 'Missing required quote fields (hallId, customerName, customerEmail, customerPhone, eventType, guestCount, eventDate)' },
        { status: 400 }
      );
    }

    const result = await createQuote({
      hallId,
      userId: session?.userId || null,
      customerName,
      customerEmail,
      customerPhone,
      eventType,
      guestCount: parseInt(guestCount, 10),
      eventDate,
      slot,
      packageId: packageId || null,
      selectedAddons: selectedAddons || [],
      specialRequirements: specialRequirements || null,
      notes: notes || null,
    });

    return NextResponse.json(
      {
        success: true,
        quoteNumber: result.quote.quoteNumber,
        quote: result.quote,
        breakdown: result.breakdown,
        hall: result.sanitizedHall,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quote request' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    if (session.role === 'ADMIN') {
      const status = searchParams.get('status');
      const where: any = {};
      if (status && status !== 'all') {
        where.status = status;
      }

      const quotes = await prisma.quote.findMany({
        where,
        include: {
          hall: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: { select: { name: true } },
            },
          },
          versions: {
            take: 1,
            orderBy: { versionNumber: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ quotes });
    }

    // Customer quotes
    const quotes = await listCustomerQuotes(session.userId, session.email);
    return NextResponse.json({ quotes });
  } catch (error: any) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}
