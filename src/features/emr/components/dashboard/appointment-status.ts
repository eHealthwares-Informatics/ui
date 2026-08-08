import type { Appointment, AppointmentStatus, Priority } from '../../lib/emr-types';

export type StatusStyle = {
  label: string;
  color: string;
  dotColor: string;
  cardTint: string;
  borderColor: string;
};

const STATUS_STYLES: Record<AppointmentStatus, StatusStyle> = {
  SCHEDULED: {
    label: 'Scheduled',
    color: 'blue',
    dotColor: '#228be6',
    cardTint: '#e7f1ff',
    borderColor: '#a5c9f5',
  },
  CHECKED_IN: {
    label: 'Checked In',
    color: 'teal',
    dotColor: '#12b886',
    cardTint: '#e6fcf5',
    borderColor: '#96d8c0',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'orange',
    dotColor: '#fd7e14',
    cardTint: '#fff4e6',
    borderColor: '#f7c38a',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'green',
    dotColor: '#40c057',
    cardTint: '#ebfbee',
    borderColor: '#b2f2bb',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'gray',
    dotColor: '#868e96',
    cardTint: '#f1f3f5',
    borderColor: '#dee2e6',
  },
  NO_SHOW: {
    label: 'No Show',
    color: 'gray',
    dotColor: '#adb5bd',
    cardTint: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  MISSED: {
    label: 'Missed',
    color: 'gray',
    dotColor: '#adb5bd',
    cardTint: '#f8f9fa',
    borderColor: '#e9ecef',
  },
};

const PRIORITY_STYLE: Record<Priority, { color: string; dotColor: string; cardTint: string; borderColor: string }> = {
  ROUTINE: { color: 'blue', dotColor: '#228be6', cardTint: '#e7f1ff', borderColor: '#a5c9f5' },
  URGENT: { color: 'yellow', dotColor: '#fab005', cardTint: '#fff9db', borderColor: '#ffe066' },
  EMERGENCY: { color: 'red', dotColor: '#fa5252', cardTint: '#fff5f5', borderColor: '#ffc9c9' },
};

export function appointmentStyle(appointment: Appointment): StatusStyle {
  if (appointment.priority === 'EMERGENCY' || appointment.priority === 'URGENT') {
    const p = PRIORITY_STYLE[appointment.priority];
    return {
      label: appointment.priority === 'EMERGENCY' ? 'Emergency' : 'Urgent',
      ...p,
    };
  }
  return STATUS_STYLES[appointment.status];
}

export function appointmentAction(appointment: Appointment): { label: string; variant: 'filled' | 'light' | 'outline'; color: string } | null {
  switch (appointment.status) {
    case 'SCHEDULED':
      return { label: 'Check In', variant: 'filled', color: 'blue' };
    case 'CHECKED_IN':
      return { label: 'Start Visit', variant: 'filled', color: 'teal' };
    case 'IN_PROGRESS':
      return { label: 'Complete', variant: 'filled', color: 'green' };
    case 'COMPLETED':
      return { label: 'View', variant: 'outline', color: 'gray' };
    default:
      return null;
  }
}
