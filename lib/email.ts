import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
export const defaultResend = resendApiKey ? new Resend(resendApiKey) : null;
let activeResend: any = defaultResend;

/**
 * Allows automated tests to inject a mock Resend client or spy
 */
export function setResendClient(client: any) {
  activeResend = client;
}

/**
 * Resets the active Resend client back to default
 */
export function resetResendClient() {
  activeResend = defaultResend;
}

export const resend = defaultResend;

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: {
    statusCode?: number;
    name?: string;
    message: string;
  };
}

export interface BookingConfirmationEmailParams {
  to: string;
  customerName: string;
  bookingNumber: string;
  hallName: string;
  eventDate: string;
  timeSlot: string;
  guestCount: number;
  totalAmount: number;
}

export const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Utsav Venues <onboarding@resend.dev>';
export const DEFAULT_SUPPORT_EMAIL = process.env.RESEND_SUPPORT_EMAIL || process.env.RESEND_FROM_EMAIL || 'Utsav Venues Support <onboarding@resend.dev>';
export const DEFAULT_EVENTS_EMAIL = process.env.RESEND_EVENTS_EMAIL || process.env.RESEND_FROM_EMAIL || 'Utsav Venues Events <onboarding@resend.dev>';

export function buildOtpEmailPayload(to: string, otpCode: string) {
  return {
    from: DEFAULT_FROM_EMAIL,
    to,
    subject: `Your Verification Code: ${otpCode} - Utsav Venues`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #92400e; margin-top: 0;">Utsav Venues Verification</h2>
        <p style="color: #44403c; font-size: 14px;">Use the verification code below to complete your registration or security verification:</p>
        <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #78350f;">${otpCode}</span>
        </div>
        <p style="color: #78716c; font-size: 12px;">This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 20px 0;" />
        <p style="color: #a8a29e; font-size: 11px; text-align: center;">© 2026 Utsav Venues Platform. All rights reserved.</p>
      </div>
    `,
  };
}

export function buildBookingConfirmationPayload(params: BookingConfirmationEmailParams) {
  return {
    from: DEFAULT_FROM_EMAIL,
    to: params.to,
    subject: `Booking Confirmed! [Ref: ${params.bookingNumber}] - ${params.hallName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #92400e; margin: 0; font-size: 22px;">Booking Confirmation</h1>
          <p style="color: #16a34a; font-weight: bold; font-size: 14px; margin-top: 4px;">✓ Slot Successfully Confirmed & Guaranteed</p>
        </div>
        <p style="color: #44403c; font-size: 14px;">Dear ${params.customerName},</p>
        <p style="color: #44403c; font-size: 14px;">Your venue reservation at <strong>${params.hallName}</strong> has been secured with guaranteed database concurrency locking.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f5f5f4;">
            <td style="padding: 8px 0; color: #78716c;">Booking Reference:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1c1917; text-align: right;">${params.bookingNumber}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f5f5f4;">
            <td style="padding: 8px 0; color: #78716c;">Event Date:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1c1917; text-align: right;">${params.eventDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f5f5f4;">
            <td style="padding: 8px 0; color: #78716c;">Time Slot:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1c1917; text-align: right;">${params.timeSlot}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f5f5f4;">
            <td style="padding: 8px 0; color: #78716c;">Guests:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1c1917; text-align: right;">${params.guestCount} Guests</td>
          </tr>
          <tr style="border-bottom: 2px solid #e7e5e4;">
            <td style="padding: 10px 0; color: #1c1917; font-weight: bold; font-size: 15px;">Total Paid:</td>
            <td style="padding: 10px 0; font-weight: 800; color: #92400e; font-size: 16px; text-align: right;">₹${params.totalAmount.toLocaleString('en-IN')}</td>
          </tr>
        </table>

        <div style="background-color: #f5f5f4; border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 12px; color: #57534e;">
          <strong>No Surprise Charges Guarantee:</strong> All venue hire charges, catering allowances, and 18% GST have been fully accounted for in this receipt.
        </div>
        <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
        <p style="color: #a8a29e; font-size: 11px; text-align: center;">Utsav Venues Platform • Transparent Venue Bookings</p>
      </div>
    `,
  };
}

export async function sendOtpEmail(to: string, otpCode: string): Promise<EmailDeliveryResult> {
  const client = activeResend;
  if (!client) {
    console.log(`[Email] Resend not configured. Simulated OTP for ${to}: ${otpCode}`);
    return { success: true, simulated: true };
  }

  const payload = buildOtpEmailPayload(to, otpCode);

  try {
    const { data, error } = await client.emails.send(payload);

    if (error) {
      console.error(`[EMAIL-FAILURE] Resend OTP error delivering to ${to}:`, error);
      return {
        success: false,
        error: {
          statusCode: (error as any).statusCode || 422,
          name: error.name || 'validation_error',
          message: error.message,
        },
      };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error(`[EMAIL-FAILURE] Failed to send OTP email to ${to}:`, err.message);
    const errName = err.name && err.name !== 'Error' ? err.name : 'NetworkError';
    return {
      success: false,
      error: {
        statusCode: err.statusCode || 500,
        name: errName,
        message: err.message,
      },
    };
  }
}

export async function sendBookingConfirmationEmail(
  params: BookingConfirmationEmailParams
): Promise<EmailDeliveryResult> {
  const client = activeResend;
  if (!client) {
    console.log(`[Email] Resend not configured. Simulated booking receipt for ${params.to}`);
    return { success: true, simulated: true };
  }

  const payload = buildBookingConfirmationPayload(params);

  try {
    const { data, error } = await client.emails.send(payload);

    if (error) {
      console.error(`[EMAIL-FAILURE] Resend booking confirmation error for [${params.bookingNumber}] to ${params.to}:`, error);
      return {
        success: false,
        error: {
          statusCode: (error as any).statusCode || 422,
          name: error.name || 'validation_error',
          message: error.message,
        },
      };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error(`[EMAIL-FAILURE] Failed to send booking confirmation to ${params.to}:`, err.message);
    const errName = err.name && err.name !== 'Error' ? err.name : 'NetworkError';
    return {
      success: false,
      error: {
        statusCode: err.statusCode || 500,
        name: errName,
        message: err.message,
      },
    };
  }
}

export interface ContactAcknowledgementEmailParams {
  to: string;
  name: string;
  ticketNumber: string;
  subject: string;
  category?: string;
}

export function buildContactAcknowledgementPayload(params: ContactAcknowledgementEmailParams) {
  return {
    from: DEFAULT_SUPPORT_EMAIL,
    to: params.to,
    subject: `Enquiry Received [Ref: ${params.ticketNumber}] - Utsav Venues Support`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #92400e; margin: 0; font-size: 20px;">Utsav Venues Concierge Support</h2>
          <p style="color: #16a34a; font-weight: bold; font-size: 13px; margin-top: 4px;">✓ Inquiry Logged & Assigned to Support Queue</p>
        </div>
        <p style="color: #44403c; font-size: 14px;">Dear ${params.name},</p>
        <p style="color: #44403c; font-size: 14px; line-height: 1.5;">
          Thank you for contacting Utsav Venues. We have received your request regarding <strong>"${params.subject}"</strong>.
          Our dedicated concierge support team will review your inquiry and follow up with you as soon as possible.
        </p>

        <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin: 20px 0;">
          <div style="font-size: 13px; color: #78350f;"><strong>Support Reference Ticket:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold;">${params.ticketNumber}</span></div>
          <div style="font-size: 12px; color: #92400e; margin-top: 4px;">Category: <strong>${params.category || 'General Enquiry'}</strong></div>
        </div>

        <div style="background-color: #f5f5f4; border-radius: 8px; padding: 12px; font-size: 12px; color: #57534e; line-height: 1.5;">
          <strong>Important Note:</strong> This is an automated acknowledgement confirming receipt of your message into our secure queue. A support team specialist will get back to you shortly. To protect your reservation guarantee and pricing transparency, all communication is routed securely through Utsav Venues Concierge.
        </div>

        <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 20px 0;" />
        <p style="color: #78716c; font-size: 12px; text-align: center;">Need urgent assistance? Call Utsav Concierge at <strong>1800-UTSAV-CARE</strong> or reply to this email with your reference ticket.</p>
        <p style="color: #a8a29e; font-size: 11px; text-align: center;">© 2026 Utsav Venues Platform • Transparent Venue Bookings</p>
      </div>
    `,
  };
}

export async function sendContactAcknowledgementEmail(
  params: ContactAcknowledgementEmailParams
): Promise<EmailDeliveryResult> {
  const client = activeResend;
  if (!client) {
    console.log(`[Email] Resend not configured. Simulated acknowledgement for [${params.ticketNumber}] to ${params.to}`);
    return { success: true, simulated: true };
  }

  const payload = buildContactAcknowledgementPayload(params);

  try {
    const { data, error } = await client.emails.send(payload);

    if (error) {
      console.error(`[EMAIL-FAILURE] Resend acknowledgement error for [${params.ticketNumber}] to ${params.to}:`, error);
      return {
        success: false,
        error: {
          statusCode: (error as any).statusCode || 422,
          name: error.name || 'validation_error',
          message: error.message,
        },
      };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error(`[EMAIL-FAILURE] Failed to send contact acknowledgement to ${params.to}:`, err.message);
    const errName = err.name && err.name !== 'Error' ? err.name : 'NetworkError';
    return {
      success: false,
      error: {
        statusCode: err.statusCode || 500,
        name: errName,
        message: err.message,
      },
    };
  }
}

export interface GuestInvitationEmailParams {
  to: string;
  guestName?: string;
  hostName: string;
  eventName: string;
  hallName: string;
  hallAddress: string;
  eventDate: string;
  timeSlot: string;
  customMessage?: string;
}

export function buildGuestInvitationPayload(params: GuestInvitationEmailParams) {
  return {
    from: DEFAULT_EVENTS_EMAIL,
    to: params.to,
    subject: `You are cordially invited! ${params.hostName} invites you to ${params.eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 32px;">💌</span>
          <h1 style="color: #92400e; margin: 8px 0 0 0; font-size: 22px;">Cordially Invited</h1>
          <p style="color: #78716c; font-size: 14px; margin-top: 4px;">${params.hostName} invites you to celebrate</p>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
          <h2 style="color: #b45309; margin: 0 0 12px 0; font-size: 20px;">${params.eventName}</h2>
          ${params.customMessage ? `<p style="color: #44403c; font-size: 14px; font-style: italic; margin-bottom: 16px;">"${params.customMessage}"</p>` : ''}
          
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-top: 12px;">
            <tr style="border-bottom: 1px solid #fef3c7;">
              <td style="padding: 8px 0; color: #78716c; font-weight: bold;">Date:</td>
              <td style="padding: 8px 0; color: #1c1917; font-weight: bold; text-align: right;">${params.eventDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #fef3c7;">
              <td style="padding: 8px 0; color: #78716c; font-weight: bold;">Time:</td>
              <td style="padding: 8px 0; color: #1c1917; font-weight: bold; text-align: right;">${params.timeSlot}</td>
            </tr>
            <tr style="border-bottom: 1px solid #fef3c7;">
              <td style="padding: 8px 0; color: #78716c; font-weight: bold;">Venue:</td>
              <td style="padding: 8px 0; color: #1c1917; font-weight: bold; text-align: right;">${params.hallName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #78716c; font-weight: bold;">Address:</td>
              <td style="padding: 8px 0; color: #1c1917; font-weight: bold; text-align: right;">${params.hallAddress}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f5f5f4; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 12px; color: #57534e; text-align: center;">
          Looking for directions or venue information? Verified details are managed through Utsav Venues.
        </div>
        <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 20px 0;" />
        <p style="color: #a8a29e; font-size: 11px; text-align: center;">Invitation sent via Utsav Venues Platform • Verified Celebrations</p>
      </div>
    `,
  };
}

export async function sendGuestInvitationEmail(
  params: GuestInvitationEmailParams
): Promise<EmailDeliveryResult> {
  const client = activeResend;
  if (!client) {
    console.log(`[Email] Resend not configured. Simulated guest invitation to ${params.to} for ${params.eventName}`);
    return { success: true, simulated: true };
  }

  const payload = buildGuestInvitationPayload(params);

  try {
    const { data, error } = await client.emails.send(payload);

    if (error) {
      console.error(`[EMAIL-FAILURE] Resend guest invitation error to ${params.to}:`, error);
      return {
        success: false,
        error: {
          statusCode: (error as any).statusCode || 422,
          name: error.name || 'validation_error',
          message: error.message,
        },
      };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error(`[EMAIL-FAILURE] Failed to send guest invitation to ${params.to}:`, err.message);
    const errName = err.name && err.name !== 'Error' ? err.name : 'NetworkError';
    return {
      success: false,
      error: {
        statusCode: err.statusCode || 500,
        name: errName,
        message: err.message,
      },
    };
  }
}