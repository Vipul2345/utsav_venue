/**
 * Comprehensive input validation utilities for UTSAV VENUES.
 * Used across both frontend client forms and backend server API routes.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates email format using RFC-compliant pattern
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates phone numbers (supports 10-digit mobile, optional country code e.g. +91, 0 prefix, spaces/dashes)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Allows +91 followed by 10 digits, or 10 digits starting with 6-9, or 0 followed by 10 digits
  const phoneRegex = /^(\+?\d{1,3})?[6-9]\d{9}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*()_+-=[]{}|;':",./<>?)
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
} {
  const feedback: string[] = [];
  if (!password || typeof password !== 'string') {
    return { isValid: false, score: 0, feedback: ['Password is required'] };
  }

  let score = 0;
  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters long');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('At least one uppercase letter (A-Z)');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('At least one lowercase letter (a-z)');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('At least one digit (0-9)');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('At least one special character (e.g. !@#$%^&*)');

  return {
    isValid: feedback.length === 0,
    score,
    feedback,
  };
}

/**
 * Validates date string in YYYY-MM-DD format and ensures it is not in the past
 */
export function validateEventDate(
  dateStr: string,
  options: { allowPast?: boolean; minDate?: Date } = {}
): { isValid: boolean; error?: string } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, error: 'Event date is required' };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { isValid: false, error: 'Date must be formatted as YYYY-MM-DD' };
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return { isValid: false, error: 'Invalid calendar date' };
  }

  if (!options.allowPast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed < today) {
      return { isValid: false, error: 'Booking date cannot be in the past' };
    }
  }

  if (options.minDate && parsed < options.minDate) {
    return { isValid: false, error: 'Date must be after the minimum required lead time' };
  }

  return { isValid: true };
}

/**
 * Validates time intervals (HH:mm)
 */
export function validateTimeInterval(
  startTime: string,
  endTime: string,
  minDurationMinutes: number = 60
): { isValid: boolean; error?: string } {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime)) {
    return { isValid: false, error: 'Start time must be in HH:mm (24-hour) format' };
  }
  if (!timeRegex.test(endTime)) {
    return { isValid: false, error: 'End time must be in HH:mm (24-hour) format' };
  }

  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);

  const startMins = h1 * 60 + m1;
  const endMins = h2 * 60 + m2;

  if (endMins <= startMins) {
    return { isValid: false, error: 'End time must be later than start time' };
  }

  if (endMins - startMins < minDurationMinutes) {
    return {
      isValid: false,
      error: `Minimum booking duration is ${Math.round(minDurationMinutes / 60)} hour(s)`,
    };
  }

  return { isValid: true };
}

/**
 * Validates guest count against hall capacity
 */
export function validateGuestCount(
  guestCount: any,
  minCapacity?: number,
  maxCapacity?: number
): { isValid: boolean; error?: string } {
  const count = Number(guestCount);
  if (isNaN(count) || !Number.isInteger(count) || count <= 0) {
    return { isValid: false, error: 'Guest count must be a positive whole number' };
  }

  if (minCapacity !== undefined && count < minCapacity) {
    return {
      isValid: false,
      error: `Guest count cannot be less than minimum hall capacity (${minCapacity} guests)`,
    };
  }

  if (maxCapacity !== undefined && count > maxCapacity) {
    return {
      isValid: false,
      error: `Guest count exceeds maximum hall capacity (${maxCapacity} guests)`,
    };
  }

  return { isValid: true };
}

/**
 * Validates non-negative monetary price
 */
export function validatePrice(
  price: any,
  fieldName: string = 'Price'
): { isValid: boolean; error?: string } {
  const p = Number(price);
  if (isNaN(p) || !isFinite(p) || p < 0) {
    return { isValid: false, error: `${fieldName} must be a valid non-negative number` };
  }
  return { isValid: true };
}

/**
 * Validates required text fields
 */
export function validateRequiredString(
  value: any,
  fieldName: string,
  minLength: number = 1,
  maxLength?: number
): { isValid: boolean; error?: string } {
  if (typeof value !== 'string' || value.trim().length < minLength) {
    return {
      isValid: false,
      error: minLength === 1 ? `${fieldName} is required` : `${fieldName} must be at least ${minLength} characters`,
    };
  }
  if (maxLength && value.trim().length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed ${maxLength} characters`,
    };
  }
  return { isValid: true };
}
