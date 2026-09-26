import { Badge } from '@mantine/core';
import { formatEnum } from '../../lib/emr-constants';

export type StatusKind =
  | 'appointment'
  | 'visit'
  | 'request'
  | 'encounter'
  | 'priority'
  | 'gender'
  | 'active'
  | 'sync'
  | 'submission'
  | 'staffRole'
  | 'departmentType'
  | 'wardType'
  | 'bedStatus'
  | 'bedType'
  | 'admission'
  | 'admissionType'
  | 'dischargeType'
  | 'referral'
  | 'medication';

const COLOR_MAPS: Record<StatusKind, Record<string, string>> = {
  appointment: {
    SCHEDULED: 'blue',
    CHECKED_IN: 'cyan',
    IN_PROGRESS: 'grape',
    COMPLETED: 'teal',
    CANCELLED: 'gray',
    NO_SHOW: 'red',
    MISSED: 'orange',
  },
  visit: {
    ONGOING: 'blue',
    COMPLETED: 'teal',
    CANCELLED: 'gray',
  },
  request: {
    REQUESTED: 'yellow',
    IN_PROGRESS: 'blue',
    COMPLETED: 'teal',
    CANCELLED: 'gray',
    REJECTED: 'red',
  },
  encounter: {
    CONSULTATION: 'blue',
    VITALS: 'cyan',
    HISTORY_AND_PHYSICAL: 'grape',
    CLINICAL_NOTE: 'teal',
    LAB_RESULTS: 'orange',
    DISCHARGE: 'pink',
    PROCEDURE: 'indigo',
    ADMISSION: 'red',
    OTHER: 'gray',
  },
  priority: {
    ROUTINE: 'gray',
    URGENT: 'orange',
    EMERGENCY: 'red',
  },
  gender: {
    MALE: 'blue',
    FEMALE: 'pink',
    OTHER: 'gray',
  },
  active: {
    true: 'teal',
    false: 'gray',
  },
  sync: {
    NONE: 'gray',
    PENDING: 'yellow',
    SYNCED: 'teal',
    FAILED: 'red',
  },
  submission: {
    DRAFT: 'gray',
    SUBMITTED: 'teal',
    AMENDED: 'blue',
  },
  staffRole: {
    Doctor: 'blue',
    Nurse: 'pink',
    Technician: 'cyan',
    Therapist: 'grape',
    Admin: 'orange',
    Support: 'gray',
  },
  departmentType: {
    OPD: 'blue',
    INPATIENT: 'grape',
    EMERGENCY: 'red',
    LABORATORY: 'cyan',
    PHARMACY: 'teal',
    RADIOLOGY: 'indigo',
    MATERNITY: 'pink',
    SUPPORT: 'gray',
    OTHER: 'gray',
  },
  wardType: {
    GENERAL: 'blue',
    PRIVATE: 'indigo',
    ICU: 'red',
    PEDIATRIC: 'pink',
    MATERNITY: 'grape',
    ISOLATION: 'orange',
    EMERGENCY: 'red',
    OTHER: 'gray',
  },
  bedStatus: {
    AVAILABLE: 'teal',
    OCCUPIED: 'blue',
    MAINTENANCE: 'yellow',
    OUT_OF_SERVICE: 'red',
  },
  bedType: {
    STANDARD: 'gray',
    ICU: 'red',
    MATERNITY: 'pink',
    ISOLATION: 'orange',
    PEDIATRIC: 'cyan',
    RECOVERY: 'teal',
  },
  admission: {
    ADMITTED: 'blue',
    TRANSFERRED: 'grape',
    DISCHARGED: 'teal',
  },
  admissionType: {
    EMERGENCY: 'red',
    URGENT: 'orange',
    ELECTIVE: 'blue',
    MATERNITY: 'pink',
    SURGICAL: 'grape',
    MEDICAL: 'teal',
  },
  dischargeType: {
    DISCHARGED_HOME: 'teal',
    DIED: 'red',
    REFERRED: 'blue',
    TRANSFERRED: 'grape',
    SELF_DISCHARGE: 'gray',
    AMA: 'orange',
  },
  referral: {
    PENDING: 'yellow',
    ACCEPTED: 'teal',
    DECLINED: 'red',
    COMPLETED: 'blue',
  },
  medication: {
    PRESCRIBED: 'yellow',
    ADMINISTERED: 'teal',
    PARTIALLY_ADMINISTERED: 'orange',
    CANCELLED: 'gray',
  },
};

export function StatusBadge({ value, kind }: { value: unknown; kind: StatusKind }) {
  const raw = value == null ? '—' : String(value);
  const color = COLOR_MAPS[kind]?.[raw] ?? 'gray';
  return (
    <Badge color={color} variant="light" size="sm">
      {formatEnum(raw)}
    </Badge>
  );
}
