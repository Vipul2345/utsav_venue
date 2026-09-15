import { AdminRoleType, AuthSession } from './types';

export const ADMIN_PERMISSIONS = {
  // Halls & Occasions
  VIEW_HALLS: 'view_halls',
  MANAGE_HALLS: 'manage_halls',
  APPROVE_HALLS: 'approve_halls',
  REJECT_HALLS: 'reject_halls',
  APPROVE_OCCASIONS: 'approve_occasions',

  // Managers
  VIEW_MANAGERS: 'view_managers',
  VERIFY_MANAGERS: 'verify_managers',

  // Bookings
  VIEW_BOOKINGS: 'view_bookings',
  MANAGE_BOOKINGS: 'manage_bookings',

  // Finance & Payments
  VIEW_PAYMENTS: 'view_payments',
  MANAGE_REFUNDS: 'manage_refunds',
  VIEW_REPORTS: 'view_reports',
  VIEW_COMMISSIONS: 'view_commissions',

  // Users & Roles
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  MANAGE_ADMINS: 'manage_admins',

  // Reviews & Settings & Audit
  VIEW_REVIEWS: 'view_reviews',
  MANAGE_REVIEWS: 'manage_reviews',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_SETTINGS: 'manage_settings',
} as const;

export type PermissionKey = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export const ROLE_DEFAULT_PERMISSIONS: Record<AdminRoleType, PermissionKey[]> = {
  SUPER_ADMIN: Object.values(ADMIN_PERMISSIONS),

  OPERATIONS_ADMIN: [
    ADMIN_PERMISSIONS.VIEW_HALLS,
    ADMIN_PERMISSIONS.MANAGE_HALLS,
    ADMIN_PERMISSIONS.VIEW_BOOKINGS,
    ADMIN_PERMISSIONS.MANAGE_BOOKINGS,
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.MANAGE_USERS,
    ADMIN_PERMISSIONS.VIEW_REVIEWS,
    ADMIN_PERMISSIONS.MANAGE_REVIEWS,
    ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS,
  ],

  VERIFICATION_ADMIN: [
    ADMIN_PERMISSIONS.VIEW_MANAGERS,
    ADMIN_PERMISSIONS.VERIFY_MANAGERS,
    ADMIN_PERMISSIONS.VIEW_HALLS,
    ADMIN_PERMISSIONS.APPROVE_HALLS,
    ADMIN_PERMISSIONS.REJECT_HALLS,
    ADMIN_PERMISSIONS.APPROVE_OCCASIONS,
    ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS,
  ],

  FINANCE_ADMIN: [
    ADMIN_PERMISSIONS.VIEW_PAYMENTS,
    ADMIN_PERMISSIONS.MANAGE_REFUNDS,
    ADMIN_PERMISSIONS.VIEW_REPORTS,
    ADMIN_PERMISSIONS.VIEW_COMMISSIONS,
    ADMIN_PERMISSIONS.VIEW_BOOKINGS,
    ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS,
  ],

  SUPPORT_ADMIN: [
    ADMIN_PERMISSIONS.VIEW_BOOKINGS,
    ADMIN_PERMISSIONS.MANAGE_BOOKINGS,
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.VIEW_REVIEWS,
    ADMIN_PERMISSIONS.MANAGE_REVIEWS,
    ADMIN_PERMISSIONS.VIEW_HALLS,
  ],
};

export function hasPermission(
  session: AuthSession | null | undefined,
  requiredPermission: PermissionKey
): boolean {
  if (!session || session.role !== 'ADMIN') return false;
  if (session.adminRole === 'SUPER_ADMIN') return true;

  // Check custom granted permissions if present
  if (session.permissions && session.permissions.includes(requiredPermission)) {
    return true;
  }

  // Fallback to role-based defaults
  if (session.adminRole && ROLE_DEFAULT_PERMISSIONS[session.adminRole]) {
    return ROLE_DEFAULT_PERMISSIONS[session.adminRole].includes(requiredPermission);
  }

  return false;
}
