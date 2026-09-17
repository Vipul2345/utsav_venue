export type UserRole = 'CUSTOMER' | 'MANAGER' | 'ADMIN';

export type AdminRoleType =
  | 'SUPER_ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'VERIFICATION_ADMIN'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_ADMIN';

export type ManagerVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type HallStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'ARCHIVED';

export type OccasionApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type BookingStatus =
  | 'DRAFT'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'HOLD_EXPIRED';

export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type CateringType = 'NONE' | 'VEG' | 'NON_VEG';

export interface AuthSession {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  managerProfileId?: string | null;
  adminRole?: AdminRoleType | null;
  permissions?: string[];
}

export interface PricingBreakdown {
  startDate: string;
  endDate: string;
  numberOfDays: number;
  dailyBaseRental: number;
  baseRental: number;
  isWeekend: boolean;
  weekendDaysCount: number;
  weekendSurcharge: number;
  cateringType: CateringType;
  perPlateRate: number;
  guestCount: number;
  cateringTotal: number;
  addonsList: Array<{ name: string; price: number; quantity: number; total: number }>;
  addonsTotal: number;
  cleaningFee: number;
  subtotal: number;
  taxRatePercent: number;
  taxesAmount: number;
  totalAmount: number;
  platformCommissionPercent: number;
  platformCommissionAmount: number;
  managerPayoutAmount: number;
}
