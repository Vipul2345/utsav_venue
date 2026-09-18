import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { processChatQuery, sanitizeChatOutput } from '@/lib/services/aiChatService';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    const { message, bookingNumber } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const query = message.trim();
    const lower = query.toLowerCase();

    // 1. Critical Rule Check: Manager contact requests must strictly redirect to Utsav Concierge
    if (
      lower.includes('manager contact') ||
      lower.includes('manager phone') ||
      lower.includes('manager number') ||
      lower.includes('call manager') ||
      lower.includes('manager email') ||
      lower.includes('contact the owner') ||
      lower.includes('owner phone') ||
      lower.includes('hall manager') ||
      lower.includes('manager details')
    ) {
      return NextResponse.json({
        reply: `To protect your booking guarantee, pricing transparency, and complete dispute resolution, Utsav Venues acts as your verified booking intermediary. Direct venue manager personal contact details are kept strictly confidential.

For any inquiries, special venue requests, or site visit scheduling, our dedicated Concierge Care team is available 24/7 at **1800-UTSAV-CARE** or via email at **support@utsavvenues.com**.`,
        category: 'POLICY',
        suggestions: ['Check Booking Status', 'Venue Packages', 'Cancellation Policy', 'Raise Support Ticket'],
      });
    }

    // 2. Booking Status Lookup Intent (Authoritative direct DB retrieval)
    const bookingMatch = query.match(/BK-\d{4}-\d{5}-[A-Z0-9]{4}/i) || (bookingNumber ? [bookingNumber] : null);
    if (bookingMatch || lower.includes('booking status') || lower.includes('my booking') || lower.includes('track booking')) {
      const refNumber = bookingMatch ? bookingMatch[0].toUpperCase() : null;

      if (!refNumber) {
        if (session && session.userId) {
          // Find user's latest booking
          const latestBooking = await prisma.booking.findFirst({
            where: { customerId: session.userId },
            orderBy: { createdAt: 'desc' },
            include: { hall: { select: { name: true, city: { select: { name: true } } } } },
          });

          if (latestBooking) {
            const dateStr = latestBooking.startDate && latestBooking.endDate && latestBooking.startDate !== latestBooking.endDate
              ? `${latestBooking.startDate} to ${latestBooking.endDate}`
              : latestBooking.eventDate;

            return NextResponse.json({
              reply: `Here is the authoritative status for your latest reservation:
• **Booking Ref:** ${latestBooking.bookingNumber}
• **Venue:** ${latestBooking.hall.name} (${latestBooking.hall.city?.name})
• **Date:** ${dateStr} (${latestBooking.startTime} – ${latestBooking.endTime})
• **Status:** **${latestBooking.status}**
• **Total Amount:** ₹${latestBooking.totalAmount.toLocaleString('en-IN')}

Would you like help with email invitations, KYC document verification, or cancellation guidelines for this booking?`,
              booking: {
                id: latestBooking.id,
                bookingNumber: latestBooking.bookingNumber,
                status: latestBooking.status,
              },
              suggestions: ['Invite Guests', 'Upload KYC Documents', 'Cancellation Rules', 'Raise Support Ticket'],
            });
          }
        }

        return NextResponse.json({
          reply: `Please provide your **Booking Reference Number** (e.g., \`BK-2026-00001-ABCD\`) and I will instantly retrieve your verified reservation status from our database.`,
          actionRequired: 'PROVIDE_BOOKING_NUMBER',
          suggestions: ['Check Active Bookings', 'How do I find my booking reference?'],
        });
      }

      // Query database for authoritative booking record
      const booking = await prisma.booking.findUnique({
        where: { bookingNumber: refNumber },
        include: {
          hall: {
            select: {
              name: true,
              address: true,
              city: { select: { name: true } },
            },
          },
          payments: {
            where: { status: 'SUCCESS' },
            select: { amount: true, providerTransactionId: true, paidAt: true },
          },
        },
      });

      if (!booking) {
        return NextResponse.json({
          reply: `I searched our verified database but could not find a booking matching **${refNumber}**. Please double-check the reference number on your booking receipt or email confirmation. If you believe this is an error, our support team can help you verify it.`,
          suggestions: ['Search Again', 'Raise Support Ticket', 'Contact Concierge'],
        });
      }

      const dateRange = booking.startDate && booking.endDate && booking.startDate !== booking.endDate
        ? `${booking.startDate} to ${booking.endDate} (${booking.numberOfDays} days)`
        : booking.eventDate;

      let paymentNote = 'Payment pending temporary slot hold.';
      if (booking.status === 'CONFIRMED') {
        paymentNote = `Payment confirmed (₹${booking.totalAmount.toLocaleString('en-IN')}). Slot is mathematically locked and guaranteed.`;
      } else if (booking.status === 'CANCELLED') {
        paymentNote = `Booking cancelled. Refund amount: ₹${booking.refundAmount.toLocaleString('en-IN')}.`;
      }

      return NextResponse.json({
        reply: `**Authoritative Booking Record:**
• **Reference:** ${booking.bookingNumber}
• **Venue:** ${booking.hall.name}, ${booking.hall.city?.name}
• **Schedule:** ${dateRange} (${booking.startTime} – ${booking.endTime})
• **Guest Count:** ${booking.guestCount} Guests
• **Current Status:** **${booking.status}**
• **Payment Status:** ${paymentNote}

All communications and host coordination are handled through Utsav Concierge.`,
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
        },
        suggestions: ['Send Email Invitations', 'Upload Guest IDs', 'Cancellation Policy'],
      });
    }

    // 3. Support Ticket Escalation
    if (lower.includes('raise ticket') || lower.includes('speak to human') || lower.includes('support ticket') || lower.includes('complaint')) {
      return NextResponse.json({
        reply: `I would be happy to escalate your request directly to our human Concierge Support Specialists. 

To open a priority ticket, please submit our instant [Contact Support Form](/contact) and an automated acknowledgement ticket will be dispatched to your email immediately.
You can also call Utsav Concierge at **1800-UTSAV-CARE** or email **support@utsavvenues.com**.`,
        actionRequired: 'CREATE_TICKET_FORM',
        suggestions: ['Open Contact Form', 'Call 1800-UTSAV-CARE', 'Check Cancellation Policy'],
      });
    }

    // 4. Dynamic AI Chatbot Processing (Google Gemini API with dynamic site knowledge & strict guardrails)
    const result = await processChatQuery(query);

    return NextResponse.json({
      reply: sanitizeChatOutput(result.reply),
      suggestions: result.suggestions,
      category: result.category,
      source: result.source,
    });
  } catch (error: any) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      {
        reply: 'Our concierge assistant is currently handling a high volume of requests. For immediate assistance, please call Utsav Concierge at **1800-UTSAV-CARE** or submit an inquiry at our [Contact Page](/contact).',
        suggestions: ['Visit Contact Page', 'Retry'],
      },
      { status: 500 }
    );
  }
}
