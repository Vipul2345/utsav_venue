import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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
      lower.includes('hall manager')
    ) {
      return NextResponse.json({
        reply: `To ensure your reservation guarantee, pricing transparency, and complete dispute protection, Utsav Venues acts as your verified booking intermediary. Direct venue manager contact details are managed exclusively through our team.
        
For any inquiries, special venue requests, or site visit scheduling, our dedicated Concierge Care team is available 24/7 at **1800-UTSAV-CARE** or via email at **support@utsavvenues.com**.`,
        category: 'POLICY',
        suggestions: ['Check Booking Status', 'Venue Packages', 'Cancellation Policy', 'Raise Support Ticket'],
      });
    }

    // 2. Booking Status Lookup Intent
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

    // 3. Packages & Pricing Inquiries
    if (lower.includes('package') || lower.includes('silver') || lower.includes('gold') || lower.includes('platinum') || lower.includes('bundle') || lower.includes('bulk discount')) {
      return NextResponse.json({
        reply: `**Utsav Venues Event Packages & Tiered Volume Discounts:**
        
1. **Configurable Venue Packages**:
   Many banquet halls on Utsav Venues offer tailored event packages (**Silver**, **Gold**, **Platinum**, and **Custom Celebrations**). Packages bundle standard amenities, staging, ambient lighting, and setup services at preferential bundled pricing.
   
2. **Tiered Guest Volume Discounts**:
   When booking for large gatherings, our server automatically computes bulk savings based on verified guest volume:
   • **100–199 Guests:** ~5% off base rental & catering
   • **200–299 Guests:** ~8% celebration discount
   • **300+ Guests:** ~12% grand gathering discount

3. **Individual Add-ons**:
   You can always customize any booking with individual add-ons (DJ, Projector, Bridal Suite, Valet Parking) alongside your selected package.`,
        suggestions: ['Discover Venues with Packages', 'How is price calculated?', 'Raise Support Ticket'],
      });
    }

    // 4. Cancellation & Refund Policy Inquiries
    if (lower.includes('cancel') || lower.includes('refund') || lower.includes('policy')) {
      return NextResponse.json({
        reply: `**Utsav Venues Transparent Cancellation & Refund Policy:**
        
• **Standard Refund Window:** Bookings cancelled at least **72 hours** prior to the event start date are eligible for a **80% refund** of the total booking amount (retaining a standard 20% venue operational & turnaround fee).
• **Inside 72 Hours:** Cancellations made within 72 hours of event commencement are non-refundable due to vendor allocation and calendar reservation locks.
• **Automated Processing:** Approved refunds are initiated immediately to your original payment source within 5–7 business days.
• **Zero Double-Bookings:** When you cancel, your slot is instantly and safely returned to the public calendar.`,
        suggestions: ['Check Cancellation for My Booking', 'Speak to Concierge', 'Raise Support Ticket'],
      });
    }

    // 5. KYC & Identity Verification Inquiries
    if (lower.includes('kyc') || lower.includes('document') || lower.includes('id proof') || lower.includes('aadhaar') || lower.includes('pan card') || lower.includes('passport')) {
      return NextResponse.json({
        reply: `**Identity Verification & Document Guidelines:**
        
• **Why Required:** As per local administrative security guidelines and hospitality compliance, valid photo ID is required for primary booking attendees.
• **Member Limit:** Up to **5 key attendees / family members** (Primary Host + up to 4 key guests) can submit their documents.
• **Accepted Formats:** Aadhaar Card, PAN Card, Passport, Voter ID (PDF, JPG, PNG, up to 5 MB per document).
• **Strict Privacy:** Documents are accessible **only** to Utsav Venues authorized Admin Verification officers. They are **never** shared publicly and are **never** accessible to hall managers.
• **Rejection & Re-upload:** If a document is unclear or rejected, you will receive an explanatory note and can instantly re-upload from your booking voucher page.`,
        suggestions: ['View Booking Documents', 'Security & Privacy Policy', 'Raise Support Ticket'],
      });
    }

    // 6. Venue Discovery & Recommendations Intent
    if (lower.includes('find venue') || lower.includes('recommend') || lower.includes('hall in') || lower.includes('venues in') || lower.includes('wedding hall') || lower.includes('banquet')) {
      // Find top 3 approved venues
      const topHalls = await prisma.hall.findMany({
        where: { status: 'APPROVED' },
        take: 3,
        include: {
          city: { select: { name: true } },
          pricingRule: { select: { baseRentalPrice: true } },
        },
        orderBy: { isFeatured: 'desc' },
      });

      const list = topHalls.map((h) => `• **${h.name}** (${h.city?.name}) — From ₹${(h.pricingRule?.baseRentalPrice || 50000).toLocaleString('en-IN')}/day (${h.minCapacity}–${h.maxCapacity} guests)`).join('\n');

      return NextResponse.json({
        reply: `Here are some of our top verified and approved venues across India with guaranteed slot locking:
        
${list}

You can filter venues by city, guest count, and occasion from our search page!`,
        suggestions: ['Search in Bangalore', 'Search in Mumbai', 'Search in Delhi NCR', 'Check Dates & Pricing'],
      });
    }

    // 7. Support Ticket Escalation / Unresolved Fallback
    if (lower.includes('raise ticket') || lower.includes('speak to human') || lower.includes('support ticket') || lower.includes('help me') || lower.includes('complaint')) {
      // Prompt user to provide contact details to escalate
      return NextResponse.json({
        reply: `I would be happy to escalate your request directly to our human Concierge Support Specialists. 

To open a priority ticket, please submit our instant [Contact Support Form](/contact) and an automated acknowledgement ticket will be dispatched to your email immediately.
You can also call Utsav Concierge at **1800-UTSAV-CARE**.`,
        actionRequired: 'CREATE_TICKET_FORM',
        suggestions: ['Open Contact Form', 'Call 1800-UTSAV-CARE', 'Check Cancellation Policy'],
      });
    }

    // Default intelligent assistant response with grounded options
    return NextResponse.json({
      reply: `Hello! I am your **Utsav Venues Assistant**. I can help you with verified venue recommendations, checking your booking status, package details, tiered bulk discounts, KYC guidelines, or cancellation rules.

How can I assist your celebration today?`,
      suggestions: [
        'Check Booking Status',
        'Event Packages & Bulk Discounts',
        'KYC Document Requirements',
        'Cancellation & Refund Policy',
        'Raise Support Ticket',
      ],
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
