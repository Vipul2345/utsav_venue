import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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
      select: { customerId: true, bookingNumber: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isCustomerOwner = booking.customerId === session.userId;
    const isAdmin = session.role === 'ADMIN';

    // Strict privacy rule: Hall managers can NEVER view identity documents
    if (!isCustomerOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Identity documents are strictly restricted to Utsav Venues compliance administrators.' },
        { status: 403 }
      );
    }

    const documents = await prisma.bookingDocument.findMany({
      where: { bookingId: id },
      orderBy: { uploadedAt: 'asc' },
    });

    return NextResponse.json({
      documents,
      maxMembers: 5,
      submittedCount: documents.length,
      complianceNotes: {
        reason: 'Local administrative compliance and hospitality safety regulations require government-issued photo ID verification for primary attendees.',
        acceptedFormats: ['PDF', 'JPG', 'PNG', 'WEBP'],
        maxFileSizeMb: 5,
        accessControl: 'Confidential. Accessible exclusively to Utsav Venues Compliance Review Officers.',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch documents' }, { status: 500 });
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
      select: { customerId: true, status: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isCustomerOwner = booking.customerId === session.userId;
    const isAdmin = session.role === 'ADMIN';

    // Strict privacy: only booking owner or admin can upload
    if (!isCustomerOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { memberName, memberRole = 'Primary Host', documentType = 'Aadhaar Card', fileUrl, fileName, fileSize } = body;

    if (!memberName || typeof memberName !== 'string' || !memberName.trim()) {
      return NextResponse.json({ error: 'Attendee/member full name is required' }, { status: 400 });
    }

    if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.trim()) {
      return NextResponse.json({ error: 'Valid document file URL or upload is required' }, { status: 400 });
    }

    // Check size limit: 5MB (5 * 1024 * 1024 bytes)
    if (fileSize && Number(fileSize) > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum allowed limit of 5 MB' }, { status: 400 });
    }

    // Check maximum 5 member documents per booking
    const existingCount = await prisma.bookingDocument.count({
      where: { bookingId: id },
    });

    if (existingCount >= 5) {
      return NextResponse.json(
        { error: 'Maximum 5 member identity documents can be submitted for a single booking.' },
        { status: 400 }
      );
    }

    const validDocTypes = ['Aadhaar Card', 'PAN Card', 'Passport', 'Voter ID', 'Driving License', 'Govt ID'];
    const sanitizedDocType = validDocTypes.includes(documentType) ? documentType : 'Govt ID';

    const document = await prisma.bookingDocument.create({
      data: {
        bookingId: id,
        memberName: memberName.trim(),
        memberRole: memberRole ? String(memberRole).trim() : 'Primary Host',
        documentType: sanitizedDocType,
        fileUrl: fileUrl.trim(),
        fileName: fileName ? String(fileName).trim() : null,
        fileSize: fileSize ? Number(fileSize) : null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload document' }, { status: 500 });
  }
}
