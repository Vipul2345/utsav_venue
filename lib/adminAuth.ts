import { NextResponse } from 'next/server';
import { getSession } from './auth';
import { hasPermission, PermissionKey } from './rbac';
import { AuthSession } from './types';

export async function requireAdminPermission(
  requiredPermission?: PermissionKey
): Promise<{ session: AuthSession; errorResponse?: NextResponse }> {
  const session = await getSession();

  if (!session) {
    return {
      session: null as any,
      errorResponse: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  if (session.role !== 'ADMIN') {
    return {
      session: null as any,
      errorResponse: NextResponse.json({ error: 'Administrative access required' }, { status: 403 }),
    };
  }

  if (requiredPermission && !hasPermission(session, requiredPermission)) {
    return {
      session,
      errorResponse: NextResponse.json(
        {
          error: `Forbidden: Your administrative role (${session.adminRole}) lacks the '${requiredPermission}' permission.`,
        },
        { status: 403 }
      ),
    };
  }

  return { session };
}
