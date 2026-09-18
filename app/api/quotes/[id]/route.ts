import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getQuote, updateQuoteStatus } from '@/lib/services/quoteService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');

    const quoteData = await getQuote(id);
    if (!quoteData) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const session = await getSession();

    // Access control:
    // 1. Admin can view any quote
    // 2. Authenticated quote owner can view
    // 3. Unauthenticated user can view if providing matching customerEmail in query
    const isOwner = session?.userId && quoteData.userId === session.userId;
    const isAdmin = session?.role === 'ADMIN';
    const isEmailMatch =
      emailParam &&
      emailParam.trim().toLowerCase() === quoteData.customerEmail.toLowerCase();
    const isSessionEmailMatch =
      session?.email &&
      session.email.toLowerCase() === quoteData.customerEmail.toLowerCase();

    if (!isAdmin && !isOwner && !isEmailMatch && !isSessionEmailMatch) {
      return NextResponse.json(
        { error: 'Unauthorized to view this quote. Please provide matching email verification.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ quote: quoteData });
  } catch (error: any) {
    console.error('Error retrieving quote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve quote' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const session = await getSession();
    const quoteData = await getQuote(id);

    if (!quoteData) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Status transition authorization:
    // Customer can ACCEPT or REJECT their own quote
    // Admin can perform any transition
    const isOwner =
      (session?.userId && quoteData.userId === session.userId) ||
      (session?.email && session.email.toLowerCase() === quoteData.customerEmail.toLowerCase());
    const isAdmin = session?.role === 'ADMIN';

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized to update quote' }, { status: 403 });
    }

    const allowedCustomerStatuses = ['ACCEPTED', 'REJECTED'];
    if (!isAdmin && !allowedCustomerStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Customers can only set status to: ${allowedCustomerStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await updateQuoteStatus(quoteData.id, status, notes);

    return NextResponse.json({ success: true, quote: updated });
  } catch (error: any) {
    console.error('Error updating quote status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update quote' },
      { status: 500 }
    );
  }
}
