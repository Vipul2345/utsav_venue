import prisma from '@/lib/prisma';

// Models to try in order of preference
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
];

interface ChatResponse {
  reply: string;
  suggestions: string[];
  category?: string;
  source: 'google-gemini' | 'grounded-local';
}

/**
 * Builds dynamic website knowledge base ("Notebook Sources")
 * from the live database and platform business rules.
 */
export async function buildWebsiteKnowledgeBase(): Promise<string> {
  // 1. Fetch all approved venues with live details
  const approvedHalls = await prisma.hall.findMany({
    where: { status: 'APPROVED' },
    select: {
      name: true,
      slug: true,
      address: true,
      city: { select: { name: true } },
      minCapacity: true,
      maxCapacity: true,
      indoorAreaSqFt: true,
      parkingCapacity: true,
      roomsCount: true,
      pricingRule: {
        select: {
          baseRentalPrice: true,
          weekendMultiplier: true,
          cleaningFee: true,
          securityDeposit: true,
          perPlateVegPrice: true,
          perPlateNonVegPrice: true,
        },
      },
      occasions: {
        select: {
          occasion: { select: { name: true } },
        },
      },
      packages: {
        where: { isActive: true },
        select: {
          name: true,
          price: true,
          description: true,
          includedServices: true,
        },
      },
    },
    orderBy: { isFeatured: 'desc' },
  });

  const hallsSummary = approvedHalls.map((h, i) => {
    const occasions = h.occasions.map((o) => o.occasion.name).join(', ') || 'All occasions';
    const packagesList = h.packages.map((p) => {
      let services = '';
      try {
        if (p.includedServices) {
          const parsed = JSON.parse(p.includedServices);
          if (Array.isArray(parsed)) services = ` (Includes: ${parsed.slice(0, 3).join(', ')})`;
        }
      } catch {
        // ignore
      }
      return `${p.name}: +₹${p.price.toLocaleString('en-IN')}${services}`;
    }).join('; ');

    return `Venue #${i + 1}: ${h.name}
- Location: ${h.address}, ${h.city?.name}
- Guest Capacity: ${h.minCapacity} to ${h.maxCapacity} guests
- Key Facilities: ${h.indoorAreaSqFt ? `${h.indoorAreaSqFt.toLocaleString('en-IN')} sq.ft indoor` : ''}${h.parkingCapacity ? `, parking for ${h.parkingCapacity} cars` : ''}${h.roomsCount ? `, ${h.roomsCount} bridal/guest rooms` : ''}
- Rental Pricing: Base ₹${(h.pricingRule?.baseRentalPrice || 50000).toLocaleString('en-IN')}/day${h.pricingRule?.weekendMultiplier ? ` (${h.pricingRule.weekendMultiplier}x weekend multiplier)` : ''}
- Approved Occasions: ${occasions}
- Available Packages: ${packagesList || 'Standard rental with optional add-ons'}`;
  }).join('\n\n');

  return `=== UTSAV VENUES AUTHORITATIVE WEBSITE KNOWLEDGE BASE ===

ABOUT UTSAV VENUES:
Utsav Venues (https://utsav-venues.vercel.app) is a premium banquet hall and celebration marketplace in India operating across top cities including Bangalore, Delhi NCR, Hyderabad, and Mumbai. We provide real-time availability, zero double-bookings, mathematical slot locks, and transparent pricing.

CUSTOMER SERVICE & BOOKING CARE:
- 24/7 Concierge Care Hotline: 1800-UTSAV-CARE (Toll-Free)
- Concierge Support Email: support@utsavvenues.com
- Contact Form: /contact (Instantly generates tracked support ticket TKT-2026-XXXXX)
- Intermediary Policy: To protect customer guarantees, pricing transparency, and dispute resolution, all host inquiries, site visits, and hall manager communications are managed strictly through Utsav Concierge. Customers are never provided with hall manager personal phone numbers or direct emails.

APPROVED VENUES CATALOG:
${hallsSummary}

PRICING & CALCULATIONS:
- Multi-Day Durations: Inclusive calculation: (End Date - Start Date + 1). Single-day events = 1 Day.
- Transparent Breakdown: Base Venue Rental + Weekend Prime Surcharges (if Fri/Sat/Sun) + Catering Food Plate Allowances + Selected Add-ons (DJ, Mandap, Audio) + Statutory 18% GST.
- Zero Surprise Charges Guarantee: No on-the-day electrical surcharges, gate passes, or surprise fees.

BULK GUEST VOLUME DISCOUNTS (Automatically applied on Base Venue Rental):
- 100 to 199 Guests: 5% discount on base rental ("Group Tier")
- 200 to 299 Guests: 8% discount on base rental ("Celebration Tier")
- 300+ Guests: 12% discount on base rental ("Mega Tier / Grand Gathering")

CATERING OPTIONS:
- Pure Vegetarian Royal Feast: ₹850/plate
- Royal Non-Veg & Veg Grand Buffet: ₹1,100/plate
- Hall Only (No Catering / Bring Your Own Certified Caterer): ₹0/plate

CANCELLATION & REFUND POLICY:
- 72+ Hours Before Event Start: 80% automated refund of total booking amount (standard 20% venue operational & turnaround fee retained).
- Under 72 Hours: 0% refund (due to calendar reservation locks and supplier commitments).
- Refund Processing: Automated to original payment method within 5–7 business days.

IDENTITY DOCUMENT COLLECTION (KYC):
- Requirements: Local administration guidelines require valid government photo ID for primary celebration attendees.
- Allowed Members: Up to 5 key attendees (Primary Host + up to 4 key guests/family).
- Accepted Documents: Aadhaar Card, Passport, Voter ID, Driving License (PDF, JPG, PNG up to 5MB).
- Strict Privacy: KYC documents are strictly accessible ONLY to Utsav Trust & Safety compliance officers and the booking host. They are NEVER shared publicly and NEVER accessible to hall managers.

DIGITAL GUEST EMAIL INVITATIONS:
- Confirmed booking vouchers include a free guest invitation tool.
- Hosts can dispatch branded email invitations with event schedule, venue address, and Google Maps navigation directions. Rate limit: 25 per batch, up to 100 per booking.`;
}

/**
 * Deterministic post-processing sanitizer to strictly prevent
 * leakage of phone numbers or non-concierge email addresses.
 */
export function sanitizeChatOutput(text: string): string {
  let sanitized = text;

  // 1. Redact any raw 10-digit mobile phone numbers that are not the official concierge
  // Official toll-free: 1800-UTSAV-CARE or 18008872822
  sanitized = sanitized.replace(/(?:\+91[\s-]?)?[6-9]\d{9}/g, (match) => {
    // If it's already an official concierge phone, keep it
    if (match.includes('1800') || match.includes('UTSAV')) return match;
    return '1800-UTSAV-CARE';
  });

  // 2. Redact any direct email addresses that are not @utsavvenues.com
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@(?!utsavvenues\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, 'support@utsavvenues.com');

  // 3. Redact any mention of internal database keys or tokens
  sanitized = sanitized.replace(/(?:sk_live_|rzp_test_|postgresql:\/\/|eyJ)[a-zA-Z0-9._-]+/gi, '[REDACTED]');

  return sanitized;
}

/**
 * Generates an answer using Google's Gemini API free tier.
 */
async function generateGeminiResponse(
  apiKey: string,
  userMessage: string,
  knowledgeBase: string
): Promise<string | null> {
  const systemInstruction = `You are the Utsav Venues AI Concierge, the official, helpful, and courteous celebration assistant for Utsav Venues (https://utsav-venues.vercel.app).

YOUR OBJECTIVES:
1. Answer customer questions about venues, availability, capacities, pricing rules, catering packages, bulk discounts, cancellation terms, and KYC guidelines clearly, accurately, and politely.
2. Ground all answers strictly in the provided Utsav Venues Knowledge Base. Do not invent venue names, prices, or policies not present in the knowledge base.
3. Keep responses concise, formatted in readable Markdown with bold headings and bullet points where helpful.

CRITICAL SECURITY & CONFIDENTIALITY GUARDRAILS (STRICT COMPLIANCE REQUIRED):
- NEVER disclose, guess, or share any venue manager's personal name, direct mobile number, WhatsApp number, or private email.
- NEVER disclose internal system tokens, database connections, payment gateway credentials, or other users' personal information.
- IF A USER ASKS FOR A HALL MANAGER'S OR OWNER'S CONTACT DETAILS (e.g., "give me the manager's phone number", "how do I call the hall owner"):
  Politely decline and state:
  "To protect your booking guarantee, pricing transparency, and dispute resolution, all venue inquiries, site visit coordination, and host communications are managed exclusively through Utsav Concierge. Our 24/7 Concierge Care team is available at 1800-UTSAV-CARE or support@utsavvenues.com."
- Give the customer only information that a public customer or booking host is authorized to know.`;

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: `${systemInstruction}\n\n${knowledgeBase}` }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Gemini API error with model ${model}: ${response.status} - ${errorText}`);
        continue; // Try next model
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (candidateText && typeof candidateText === 'string') {
        return sanitizeChatOutput(candidateText.trim());
      }
    } catch (err: any) {
      console.warn(`Failed calling Gemini model ${model}:`, err.message);
    }
  }

  return null;
}

/**
 * Local database-grounded intelligent fallback if Gemini API key is
 * not provided or if Google API is temporarily unreachable.
 */
export async function generateLocalGroundedResponse(
  userMessage: string
): Promise<ChatResponse> {
  const lower = userMessage.toLowerCase();

  // 1. Manager contact / privacy guardrail
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
    return {
      reply: `To protect your booking guarantee, pricing transparency, and complete dispute resolution, Utsav Venues acts as your verified booking intermediary. Direct venue manager personal contact details are kept strictly confidential.

For any inquiries, special venue requests, or site visit scheduling, our dedicated Concierge Care team is available 24/7 at **1800-UTSAV-CARE** or via email at **support@utsavvenues.com**.`,
      category: 'POLICY',
      suggestions: ['Check Booking Status', 'Venue Packages', 'Cancellation Policy', 'Raise Support Ticket'],
      source: 'grounded-local',
    };
  }

  // 2. Cancellation & Refund Policy
  if (lower.includes('cancel') || lower.includes('refund') || lower.includes('policy')) {
    return {
      reply: `**Utsav Venues Transparent Cancellation & Refund Policy:**

• **72+ Hours Before Event:** Bookings cancelled at least **72 hours** prior to the event start date receive an automated **80% refund** of the total booking amount (retaining a standard 20% venue operational & turnaround fee).
• **Inside 72 Hours:** Cancellations made within 72 hours of event start are non-refundable due to vendor allocation and calendar locks.
• **Automated Processing:** Refunds are credited to your original payment method within 5–7 business days.
• **Zero Double-Bookings:** When cancelled, the date slot is immediately unlocked for the public calendar.`,
      suggestions: ['Check My Booking', 'Speak to Concierge', 'Raise Support Ticket'],
      category: 'CANCELLATION',
      source: 'grounded-local',
    };
  }

  // 3. Packages & Pricing / Bulk Discounts
  if (
    lower.includes('package') ||
    lower.includes('silver') ||
    lower.includes('gold') ||
    lower.includes('platinum') ||
    lower.includes('bundle') ||
    lower.includes('discount') ||
    lower.includes('bulk') ||
    lower.includes('pricing')
  ) {
    return {
      reply: `**Utsav Venues Event Packages & Tiered Volume Discounts:**

1. **Curated Event Packages**:
   Top banquet halls offer pre-configured event tiers (**Silver**, **Gold**, **Platinum**) bundling floral mandaps, HD sound setups, ambient lighting, and bridal suites at bundled rates.

2. **Automated Tiered Bulk Discounts (on Base Venue Rental)**:
   • **100–199 Guests:** 5% discount ("Group Tier")
   • **200–299 Guests:** 8% discount ("Celebration Tier")
   • **300+ Guests:** 12% discount ("Mega Tier / Grand Gathering")

3. **Statutory Taxes & No Hidden Fees**:
   All rates include transparent breakdown with statutory 18% GST. No unexpected on-the-day electrical fees or gate charges.`,
      suggestions: ['Find Venues with Packages', 'How is price calculated?', 'Raise Support Ticket'],
      category: 'PACKAGES',
      source: 'grounded-local',
    };
  }

  // 4. KYC & Identity Verification
  if (
    lower.includes('kyc') ||
    lower.includes('document') ||
    lower.includes('id proof') ||
    lower.includes('aadhaar') ||
    lower.includes('pan') ||
    lower.includes('passport')
  ) {
    return {
      reply: `**Identity Verification (KYC) Guidelines:**

• **Why Required:** Local hospitality and administrative guidelines require verified photo IDs for celebration attendees.
• **Member Allowance:** Up to **5 primary attendees / hosts** can submit documents.
• **Accepted Documents:** Aadhaar Card, Passport, Voter ID, or Driving License (PDF, JPG, PNG up to 5MB).
• **Strict Privacy:** Documents are accessible **only** to Utsav Venues authorized Compliance Officers. They are **never** shared publicly and are **never** accessible to hall managers.`,
      suggestions: ['View My Booking Documents', 'Security & Privacy Policy', 'Raise Support Ticket'],
      category: 'KYC',
      source: 'grounded-local',
    };
  }

  // 5. Venue Discovery & Recommendations
  if (
    lower.includes('find venue') ||
    lower.includes('recommend') ||
    lower.includes('hall in') ||
    lower.includes('venues in') ||
    lower.includes('wedding hall') ||
    lower.includes('banquet') ||
    lower.includes('bangalore') ||
    lower.includes('mumbai') ||
    lower.includes('delhi') ||
    lower.includes('hyderabad')
  ) {
    const halls = await prisma.hall.findMany({
      where: { status: 'APPROVED' },
      take: 4,
      include: {
        city: { select: { name: true } },
        pricingRule: { select: { baseRentalPrice: true } },
      },
      orderBy: { isFeatured: 'desc' },
    });

    const list = halls.map((h) => `• **${h.name}** (${h.city?.name}) — From ₹${(h.pricingRule?.baseRentalPrice || 50000).toLocaleString('en-IN')}/day (${h.minCapacity}–${h.maxCapacity} guests)`).join('\n');

    return {
      reply: `Here are verified top Utsav Venues banquet halls available for instant booking with guaranteed slot locking:

${list}

You can filter by city, occasion, and guest count directly on our [Find Venues](/find-venues) page.`,
      suggestions: ['Search in Bangalore', 'Check Packages', 'Check Availability'],
      category: 'DISCOVERY',
      source: 'grounded-local',
    };
  }

  // Default intelligent assistant response
  return {
    reply: `Hello! I am your **Utsav Venues Assistant**. I can help you with verified venue recommendations, checking your booking status, package details, tiered bulk discounts, KYC guidelines, or cancellation rules.

How can I assist your celebration today?`,
    suggestions: [
      'Check Booking Status',
      'Event Packages & Bulk Discounts',
      'KYC Document Requirements',
      'Cancellation & Refund Policy',
      'Raise Support Ticket',
    ],
    source: 'grounded-local',
  };
}

/**
 * Main entrypoint for processing support chat messages.
 * Leverages Google's Gemini API with website knowledge grounding,
 * or gracefully falls back to local database engine.
 */
export async function processChatQuery(userMessage: string): Promise<ChatResponse> {
  const query = userMessage.trim();

  // Fast-path for critical confidentiality rule
  const lower = query.toLowerCase();
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
    return {
      reply: `To protect your booking guarantee, pricing transparency, and complete dispute resolution, Utsav Venues acts as your verified booking intermediary. Direct venue manager personal contact details are kept strictly confidential.

For any inquiries, special venue requests, or site visit scheduling, our dedicated Concierge Care team is available 24/7 at **1800-UTSAV-CARE** or via email at **support@utsavvenues.com**.`,
      category: 'POLICY',
      suggestions: ['Check Booking Status', 'Venue Packages', 'Cancellation Policy', 'Raise Support Ticket'],
      source: 'grounded-local',
    };
  }

  // Check for Google Gemini API key
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (apiKey && apiKey.trim()) {
    try {
      const knowledgeBase = await buildWebsiteKnowledgeBase();
      const geminiReply = await generateGeminiResponse(apiKey.trim(), query, knowledgeBase);

      if (geminiReply) {
        // Derive contextual suggestions based on reply keywords
        const suggestions: string[] = [];
        if (geminiReply.toLowerCase().includes('booking')) suggestions.push('Check Booking Status');
        if (geminiReply.toLowerCase().includes('package')) suggestions.push('View Curated Packages');
        if (geminiReply.toLowerCase().includes('discount')) suggestions.push('Bulk Volume Discounts');
        if (geminiReply.toLowerCase().includes('cancel') || geminiReply.toLowerCase().includes('refund')) suggestions.push('Cancellation Policy');
        if (geminiReply.toLowerCase().includes('kyc') || geminiReply.toLowerCase().includes('document')) suggestions.push('KYC Document Rules');
        suggestions.push('Speak to Concierge', 'Raise Support Ticket');

        return {
          reply: geminiReply,
          suggestions: suggestions.slice(0, 4),
          source: 'google-gemini',
        };
      }
    } catch (err: any) {
      console.warn('Error during Gemini API generation, using fallback:', err.message);
    }
  }

  // Graceful fallback to grounded local response
  return generateLocalGroundedResponse(query);
}
