import { describe, it, expect } from 'vitest';
import { hasPermission, ADMIN_PERMISSIONS } from '../lib/rbac';
import { AuthSession } from '../lib/types';

describe('RBAC Authorization Engine', () => {
  const superAdminSession: AuthSession = {
    userId: 'admin-1',
    email: 'superadmin@platform.com',
    fullName: 'Super Admin',
    role: 'ADMIN',
    adminRole: 'SUPER_ADMIN',
  };

  const verificationAdminSession: AuthSession = {
    userId: 'admin-2',
    email: 'verify@platform.com',
    fullName: 'Verification Admin',
    role: 'ADMIN',
    adminRole: 'VERIFICATION_ADMIN',
  };

  const financeAdminSession: AuthSession = {
    userId: 'admin-3',
    email: 'finance@platform.com',
    fullName: 'Finance Admin',
    role: 'ADMIN',
    adminRole: 'FINANCE_ADMIN',
  };

  const customerSession: AuthSession = {
    userId: 'cust-1',
    email: 'cust@example.com',
    fullName: 'Customer User',
    role: 'CUSTOMER',
  };

  it('Super Admin should have all permissions', () => {
    expect(hasPermission(superAdminSession, ADMIN_PERMISSIONS.APPROVE_HALLS)).toBe(true);
    expect(hasPermission(superAdminSession, ADMIN_PERMISSIONS.MANAGE_REFUNDS)).toBe(true);
    expect(hasPermission(superAdminSession, ADMIN_PERMISSIONS.MANAGE_ADMINS)).toBe(true);
  });

  it('Verification Admin should be allowed to verify managers and approve halls', () => {
    expect(hasPermission(verificationAdminSession, ADMIN_PERMISSIONS.VERIFY_MANAGERS)).toBe(true);
    expect(hasPermission(verificationAdminSession, ADMIN_PERMISSIONS.APPROVE_HALLS)).toBe(true);
    expect(hasPermission(verificationAdminSession, ADMIN_PERMISSIONS.APPROVE_OCCASIONS)).toBe(true);
  });

  it('Verification Admin must NOT have financial refund permissions', () => {
    expect(hasPermission(verificationAdminSession, ADMIN_PERMISSIONS.MANAGE_REFUNDS)).toBe(false);
    expect(hasPermission(verificationAdminSession, ADMIN_PERMISSIONS.VIEW_PAYMENTS)).toBe(false);
    expect(hasPermission(verificationAdminSession, ADMIN_PERMISSIONS.VIEW_COMMISSIONS)).toBe(false);
  });

  it('Finance Admin should have financial permissions but not hall approval', () => {
    expect(hasPermission(financeAdminSession, ADMIN_PERMISSIONS.VIEW_PAYMENTS)).toBe(true);
    expect(hasPermission(financeAdminSession, ADMIN_PERMISSIONS.MANAGE_REFUNDS)).toBe(true);
    expect(hasPermission(financeAdminSession, ADMIN_PERMISSIONS.APPROVE_HALLS)).toBe(false);
    expect(hasPermission(financeAdminSession, ADMIN_PERMISSIONS.VERIFY_MANAGERS)).toBe(false);
  });

  it('Customer must have zero admin permissions', () => {
    expect(hasPermission(customerSession, ADMIN_PERMISSIONS.VIEW_HALLS)).toBe(false);
    expect(hasPermission(customerSession, ADMIN_PERMISSIONS.APPROVE_HALLS)).toBe(false);
  });
});
