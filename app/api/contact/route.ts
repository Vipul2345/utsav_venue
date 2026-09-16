import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidEmail, isValidPhone, validateRequiredString } from '@/lib/validation';
import { createNotification } from '@/lib/services/notificationService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, phone, subject, message } = body;

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

    // Save message to database
    const contactRecord = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        subject: subject.trim(),
        message: message.trim(),
        status: 'UNREAD',
      },
    });

    // Notify Super & Support Admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        take: 3,
      });
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: 'New Customer Inquiry',
          message: `${name.trim()} sent a message: "${subject.trim()}"`,
          type: 'SYSTEM',
          link: '/admin',
        });
      }
    } catch (notifErr) {
      console.warn('Admin notification warning:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been received. Our hospitality team will contact you shortly.',
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
