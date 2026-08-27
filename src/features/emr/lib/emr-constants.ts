export const APPOINTMENT_TYPES = [
  'CHECKUP',
  'FOLLOW_UP',
  'CONSULTATION',
  'PROCEDURE',
  'EMERGENCY',
  'SURGERY',
  'OTHER',
] as const;

export const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'MISSED',
] as const;

export const PRIORITIES = ['ROUTINE', 'URGENT', 'EMERGENCY'] as const;

export const VISIT_TYPES = ['OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'HOME_VISIT'] as const;

export const VISIT_STATUSES = ['ONGOING', 'COMPLETED', 'CANCELLED'] as const;

export const ENCOUNTER_TYPES = [
  'CONSULTATION',
  'VITALS',
  'HISTORY_AND_PHYSICAL',
  'CLINICAL_NOTE',
  'LAB_RESULTS',
  'DISCHARGE',
  'PROCEDURE',
  'ADMISSION',
  'OTHER',
] as const;

export const STAFF_ROLE_TYPES = ['Doctor', 'Nurse', 'Technician', 'Therapist', 'Admin', 'Support'] as const;
export const DEPARTMENT_TYPES = [
  'OPD',
  'INPATIENT',
  'EMERGENCY',
  'LABORATORY',
  'PHARMACY',
  'RADIOLOGY',
  'MATERNITY',
  'SUPPORT',
  'OTHER',
] as const;

export const STAFF_CATEGORIES = [
  'Medical',
  'Nursing',
  'Allied Health',
  'Pharmacy',
  'Laboratory',
  'Administrative',
  'Support',
  'Other',
] as const;

export const REQUEST_TYPES = ['PRESCRIPTION', 'LAB', 'RADIOLOGY', 'OTHER_TEST'] as const;

export const REQUEST_STATUSES = ['REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'] as const;

export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;

export const MARITAL_STATUSES = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER'] as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const GENOTYPES = ['AA', 'AS', 'SS', 'AC', 'CC', 'SC'] as const;

export const NEXT_OF_KIN_RELATIONSHIPS = ['SPOUSE', 'PARENT', 'SIBLING', 'CHILD', 'OTHER'] as const;

export const PAYMENT_PROVIDER_TYPES = ['CASH', 'HMO', 'COMPANY', 'PROGRAM', 'OTHER'] as const;

/** Convert an uppercase enum value into a readable label, e.g. IN_PROGRESS -> In Progress */
export function formatEnum(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function toSelectData(values: readonly string[]) {
  return values.map((value) => ({ value, label: formatEnum(value) }));
}
