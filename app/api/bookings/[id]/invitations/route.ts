import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { isValidEmail } from '@/lib/validation';
import { sendGuestInvitationEmail } from '@/lib/email';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { customerId: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isOwner = booking.customerId === session.userId;
    const isAdmin = session.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invitations = await prisma.eventInvitation.findMany({
      where: { bookingId: id },
      orderBy: { sentAt: 'desc' },
    });

    return NextResponse.json({ invitations, totalSent: invitations.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invitations' }, { status: 500 });
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
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        hall: {
          select: {
            name: true,
            address: true,
            city: { select: { name: true } },
          },
        },
        occasion: true,
        customer: { select: { fullName: true, email: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Authorization: only the customer who booked or admin
    const isOwner = booking.customerId === session.userId;
    const isAdmin = session.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You can only send invitations for your own bookings' }, { status: 403 });
    }

    // Status check: Must be CONFIRMED
    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: `Invitations can only be dispatched for confirmed bookings. Current status is ${booking.status}.` },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { recipients, customMessage, eventTitle } = body;

    // Recipients can be an array of strings or comma/newline separated string
    let emailList: string[] = [];
    if (Array.isArray(recipients)) {
      emailList = recipients.map((r) => String(r).trim()).filter(Boolean);
    } else if (typeof recipients === 'string') {
      emailList = recipients
        .split(/[,\n;]+/)
        .map((e) => e.trim())
        .filter(Boolean);
    }

    if (emailList.length === 0) {
      return NextResponse.json({ error: 'Please provide at least one recipient email address.' }, { status: 400 });
    }

    // Rate limiting: Max 25 recipients per batch
    if (emailList.length > 25) {
      return NextResponse.json(
        { error: 'Maximum 25 email invitations can be dispatched per request to prevent spam.' },
        { status: 400 }
      );
    }

    // Lifetime limit per booking: 100 invitations
    const existingCount = await prisma.eventInvitation.count({
      where: { bookingId: id },
    });
    if (existingCount + emailList.length > 100) {
      return NextResponse.json(
        { error: `Invitation limit reached. You can send a maximum of 100 invitations per booking (already sent: ${existingCount}).` },
        { status: 400 }
      );
    }

    // Validate email addresses
    const invalidEmails: string[] = [];
    const validEmails: string[] = [];

    for (const email of emailList) {
      if (isValidEmail(email)) {
        validEmails.push(email.toLowerCase());
      } else {
        invalidEmails.push(email);
      }
    }

    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses found: ${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}` },
        { status: 400 }
      );
    }

    const hostName = booking.customer?.fullName || session.fullName || 'The Host';
    const eventName = eventTitle ? String(eventTitle).trim() : `${booking.occasion?.name || 'Celebration'} Reception`;
    const hallName = booking.hall.name;
    const hallAddress = `${booking.hall.address}, ${booking.hall.city?.name}`;
    const dateStr = booking.startDate && booking.endDate && booking.startDate !== booking.endDate
      ? `${booking.startDate} to ${booking.endDate}`
      : booking.eventDate;
    const timeSlot = `${booking.startTime} - ${booking.endTime}`;

    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    // Dispatch invitations
    for (const to of validEmails) {
      try {
        const sendResult = await sendGuestInvitationEmail({
          to,
          hostName,
          eventName,
          hallName,
          hallAddress,
          eventDate: dateStr,
          timeSlot,
          customMessage: customMessage ? String(customMessage).trim() : undefined,
        });

        await prisma.eventInvitation.create({
          data: {
            bookingId: id,
            recipientEmail: to,
            status: sendResult.success ? 'SENT' : 'FAILED',
          },
        });

        results.push({
          email: to,
          success: sendResult.success,
          error: !sendResult.success ? sendResult.error?.message : undefined,
        });
      } catch (err: any) {
        await prisma.eventInvitation.create({
          data: {
            bookingId: id,
            recipientEmail: to,
            status: 'FAILED',
          },
        });
        results.push({ email: to, success: false, error: err.message });
      }
    }

    const sentCount = results.filter((r) => r.success).length;
    const failedList = results.filter((r) => !r.success);
    const hasSandboxRestriction = failedList.some(
      (f) =>
        f.error?.includes('verify a domain') ||
        f.error?.includes('testing emails') ||
        f.error?.includes('403')
    );

    let diagnosticMessage = `Successfully dispatched ${sentCount} of ${validEmails.length} invitation emails.`;
    if (hasSandboxRestriction) {
      diagnosticMessage += ` Note: Resend is currently in unverified sandbox mode, which only permits delivery to the registered account owner (vipulanandd@gmail.com). To deliver invitations to external guests, please verify your custom domain at resend.com/domains.`;
    } else if (failedList.length > 0) {
      diagnosticMessage += ` (${failedList.length} failed to send)`;
    }

    return NextResponse.json({
      success: sentCount > 0,
      count: sentCount,
      totalRequested: validEmails.length,
      message: diagnosticMessage,
      hasSandboxRestriction,
      results,
    });
  } catch (error: any) {
    console.error('Invitations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch invitations' },
      { status: 500 }
    );
  }
}
