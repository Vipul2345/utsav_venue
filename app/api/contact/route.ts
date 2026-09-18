import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidEmail, isValidPhone, validateRequiredString } from '@/lib/validation';
import { createNotification } from '@/lib/services/notificationService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, phone, subject, message, category = 'GENERAL' } = body;

    // Validate Required Fields
    const nameVal = validateRequiredString(name, 'Full Name', 2, 100);
    if (!nameVal.isValid) {
      return NextResponse.json({ error: nameVal.error }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit phone number.' },
        { status: 400 }
      );
    }

    const subjectVal = validateRequiredString(subject, 'Subject', 3, 150);
    if (!subjectVal.isValid) {
      return NextResponse.json({ error: subjectVal.error }, { status: 400 });
    }

    const messageVal = validateRequiredString(message, 'Message', 10, 2000);
    if (!messageVal.isValid) {
      return NextResponse.json({ error: messageVal.error }, { status: 400 });
    }

    // Generate unique support ticket number
    const ticketRandom = Math.floor(10000 + Math.random() * 90000);
    const ticketNumber = `TKT-${new Date().getFullYear()}-${ticketRandom}`;

    // Save message with category and ticketNumber
    const contactRecord = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        category: category.toUpperCase().trim(),
        ticketNumber,
        subject: subject.trim(),
        message: message.trim(),
        status: 'UNREAD',
      },
    });

    // Feature 7: Dispatch automatic non-hallucinating acknowledgement email via Resend
    let acknowledgementSent = false;
    try {
      const { sendContactAcknowledgementEmail } = await import('@/lib/email');
      const emailResult = await sendContactAcknowledgementEmail({
        to: email.toLowerCase().trim(),
        name: name.trim(),
        ticketNumber,
        subject: subject.trim(),
        category,
      });
      if (emailResult.success) {
        acknowledgementSent = true;
        await prisma.contactMessage.update({
          where: { id: contactRecord.id },
          data: {
            acknowledgementSent: true,
            acknowledgementSentAt: new Date(),
          },
        });
      }
    } catch (emailErr) {
      console.warn('[CONTACT-ACK-WARNING] Failed to dispatch acknowledgement email:', emailErr);
    }

    // If customer has an active account, create an in-app confirmation notification
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existingUser) {
        await createNotification({
          userId: existingUser.id,
          title: `Support Ticket Created: ${ticketNumber}`,
          message: `Your inquiry "${subject.trim()}" has been received. Our concierge support team is reviewing it.`,
          type: 'SYSTEM',
          link: '/contact',
        });
      }
    } catch {
      // Non-blocking
    }

    // Notify Super & Support Admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        take: 3,
      });
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: `New Support Ticket: ${ticketNumber}`,
          message: `${name.trim()} submitted inquiry [${category}]: "${subject.trim()}"`,
          type: 'SYSTEM',
          link: '/admin',
        });
      }
    } catch (notifErr) {
      console.warn('Admin notification warning:', notifErr);
    }

    return NextResponse.json({
      success: true,
      ticketNumber,
      acknowledgementSent,
      message: 'Thank you! Your request has been logged and an acknowledgement email has been sent. Our concierge team will assist you shortly.',
      inquiryId: contactRecord.id,
    });
  } catch (error: any) {
    console.error('Contact submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}
