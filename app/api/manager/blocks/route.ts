import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/auditService';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
    }

    const managerProfile = await prisma.managerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!managerProfile) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { hallId, startDate, endDate, startTime = '00:00', endTime = '23:59', reason } = body;

    if (!hallId || !startDate || !reason) {
      return NextResponse.json({ error: 'Venue, start date, and reason are required' }, { status: 400 });
    }

    // Verify ownership
    const hall = await prisma.hall.findFirst({
      where: { id: hallId, managerId: managerProfile.id },
    });

    if (!hall) {
      return NextResponse.json({ error: 'Venue not found or unauthorized' }, { status: 404 });
    }

    const block = await prisma.availabilityBlock.create({
      data: {
        hallId,
        startDate,
        endDate: endDate || startDate,
        startTime,
        endTime,
        reason,
        createdBy: session.userId,
      },
    });

    await createAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: 'AVAILABILITY_BLOCK_CREATED',
      entityType: 'BLOCK',
      entityId: block.id,
      details: { hallId, startDate, reason },
    });

    return NextResponse.json({ success: true, block });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create block' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Block ID required' }, { status: 400 });
    }

    await prisma.availabilityBlock.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete block' }, { status: 500 });
  }
}
