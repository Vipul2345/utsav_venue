import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSystemSettings, updateSystemSettings } from '@/lib/settings';
import { createAuditLog } from '@/lib/services/auditService';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { commissionPercent, holdMinutes, defaultTaxPercent, maxHallImages } = body;

    const validated: any = {};
    if (commissionPercent !== undefined) {
      const val = parseFloat(commissionPercent);
      if (isNaN(val) || val < 0 || val > 50) {
        return NextResponse.json({ error: 'Commission percent must be between 0 and 50%' }, { status: 400 });
      }
      validated.commissionPercent = val;
    }

    if (holdMinutes !== undefined) {
      const val = parseInt(holdMinutes, 10);
      if (isNaN(val) || val < 3 || val > 60) {
        return NextResponse.json({ error: 'Hold duration must be between 3 and 60 minutes' }, { status: 400 });
      }
      validated.holdMinutes = val;
    }

    if (defaultTaxPercent !== undefined) {
      const val = parseFloat(defaultTaxPercent);
      if (isNaN(val) || val < 0 || val > 28) {
        return NextResponse.json({ error: 'Tax percent must be between 0 and 28%' }, { status: 400 });
      }
      validated.defaultTaxPercent = val;
    }

    if (maxHallImages !== undefined) {
      const val = parseInt(maxHallImages, 10);
      if (isNaN(val) || val < 2 || val > 20) {
        return NextResponse.json({ error: 'Max hall images must be between 2 and 20' }, { status: 400 });
      }
      validated.maxHallImages = val;
    }

    const updated = await updateSystemSettings(validated);

    await createAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      actorEmail: session.email,
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityType: 'SETTINGS',
      entityId: 'global',
      details: { changes: validated, newSettings: updated },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
