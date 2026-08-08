export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'MISSED';

export type AppointmentType =
  | 'CHECKUP'
  | 'FOLLOW_UP'
  | 'CONSULTATION'
  | 'PROCEDURE'
  | 'EMERGENCY'
  | 'SURGERY'
  | 'OTHER';

export type Priority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export type Appointment = {
  id: string;
  organizationId: string | null;
  locationId: string | null;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  appointmentType: AppointmentType;
  date: string;
  startTime: string;
  endTime: string | null;
  providerId: string | null;
  providerName: string | null;
  status: AppointmentStatus;
  priority: Priority;
  reason: string | null;
  notes: string | null;
  visitId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardMetrics = {
  totalAppointments: number;
  checkedIn: number;
  inProgress: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  noShow: number;
  providersOnDuty: number;
  averageWaitMinutes: number;
};

export type ProviderLoadEntry = {
  providerId: string;
  providerName: string;
  patientCount: number;
};

export type DashboardSummary = {
  date: string;
  metrics: DashboardMetrics;
  appointments: Appointment[];
  providerLoad: ProviderLoadEntry[];
  upcoming: Appointment[];
};
