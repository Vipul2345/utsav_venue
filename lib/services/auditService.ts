import prisma from '../prisma';

export interface CreateAuditLogParams {
  actorId?: string | null;
  actorRole?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | string;
  ipAddress?: string | null;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const detailsString =
      typeof params.details === 'object'
        ? JSON.stringify(params.details)
        : params.details || null;

    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        actorRole: params.actorRole || null,
        actorEmail: params.actorEmail || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        details: detailsString,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
}
