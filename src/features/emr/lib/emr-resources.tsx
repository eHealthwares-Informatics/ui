import { Badge, Stack, Text } from '@mantine/core';
import type { EmrResourceConfig } from '../pages/resource-page';
import { StatusBadge } from '../components/shared/status-badge';
import { PatientForm } from '../components/patients/patient-form';
import { PatientRowActions } from '../components/patients/patient-row-actions';
import { PaymentProvidersCell } from '../components/shared/payment-providers-cell';
import { StaffForm } from '../components/staff/staff-form';
import { StaffRowActions } from '../components/staff/staff-row-actions';
import { AppointmentForm } from '../components/appointments/appointment-form';
import { AppointmentActions } from '../components/appointments/appointment-actions';
import { VisitForm } from '../components/visits/visit-form';
import { VisitActions } from '../components/visits/visit-actions';
import { RequestForm } from '../components/requests/request-form';
import { RequestRowActions } from '../components/requests/request-row-actions';
import { formatEnum } from './emr-constants';

export const emrResources: Record<string, EmrResourceConfig> = {
  patients: {
    key: 'patients',
    title: 'Patients',
    description: 'Search and manage patient demographic records.',
    endpoint: '/patients',
    createLabel: 'Register Patient',
    createForm: PatientForm,
    actions: (row) => <PatientRowActions row={row} />,
    rowLink: (row) => (row.id ? `/emr/patients/${String(row.id)}` : undefined),
    columns: [
      { key: 'patientId', label: 'MRN', render: (r) => <Badge variant="light">{String(r.patientId)}</Badge> },
      {
        key: 'patientName',
        label: 'Name',
        render: (r) => (
          <Text size="sm" fw={500}>
            {[r.firstName, r.lastName].filter(Boolean).join(' ')}
          </Text>
        ),
      },
      {
        key: 'gender',
        label: 'Gender',
        render: (r) => <StatusBadge value={r.gender} kind="gender" />,
      },
      { key: 'dateOfBirth', label: 'Date of Birth', render: (r) => String(r.dateOfBirth ?? '—') },
      { key: 'phone', label: 'Phone', render: (r) => String(r.phone ?? '—') },
      {
        key: 'paymentProviderIds',
        label: 'Payment Providers',
        render: (r) => <PaymentProvidersCell ids={r.paymentProviderIds} />,
      },
      {
        key: 'isActive',
        label: 'Active',
        render: (r) => <StatusBadge value={r.isActive} kind="active" />,
      },
    ],
  },
  staff: {
    key: 'staff',
    title: 'Staff',
    description: 'Manage hospital staff, roles, departments, and identity-user links.',
    endpoint: '/staff',
    createLabel: 'Register Staff',
    createForm: StaffForm,
    actions: (row) => <StaffRowActions row={row} />,
    columns: [
      { key: 'staffNumber', label: 'Staff #', render: (r) => <Badge variant="light">{String(r.staffNumber)}</Badge> },
      {
        key: 'name',
        label: 'Name',
        render: (r) => (
          <Text size="sm" fw={500}>
            {[r.firstName, r.lastName, r.otherNames].filter(Boolean).join(' ')}
          </Text>
        ),
      },
      { key: 'roleType', label: 'Role', render: (r) => <StatusBadge value={r.roleType} kind="staffRole" /> },
      { key: 'category', label: 'Category', render: (r) => String(r.category ?? '—') },
      { key: 'department', label: 'Department', render: (r) => String(r.department ?? '—') },
      { key: 'phone', label: 'Phone', render: (r) => String(r.phone ?? '—') },
      {
        key: 'isActive',
        label: 'Active',
        render: (r) => <StatusBadge value={r.isActive} kind="active" />,
      },
    ],
  },
  appointments: {
    key: 'appointments',
    title: 'Appointments',
    description: 'Schedule and manage patient appointments.',
    endpoint: '/appointments',
    createLabel: 'Schedule Appointment',
    createForm: AppointmentForm,
    actions: (row) => <AppointmentActions row={row} />,
    columns: [
      { key: 'appointmentNumber', label: 'Appt #', render: (r) => <Badge variant="light">{String(r.appointmentNumber)}</Badge> },
      {
        key: 'patientName',
        label: 'Patient',
        render: (r) => (
          <Text size="sm" fw={500}>
            {String(r.patientName ?? '—')}
          </Text>
        ),
      },
      { key: 'appointmentType', label: 'Type', render: (r) => formatEnum(String(r.appointmentType)) },
      { key: 'date', label: 'Date' },
      { key: 'startTime', label: 'Start' },
      { key: 'providerName', label: 'Provider', render: (r) => String(r.providerName ?? '—') },
      { key: 'priority', label: 'Priority', render: (r) => <StatusBadge value={r.priority} kind="priority" /> },
      { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} kind="appointment" /> },
    ],
  },
  visits: {
    key: 'visits',
    title: 'Visits',
    description: 'Active and historical patient visits.',
    endpoint: '/visits',
    createLabel: 'Start Visit',
    createForm: VisitForm,
    actions: (row) => <VisitActions row={row} />,
    rowLink: (row) => (row.id ? `/emr/visits/${String(row.id)}` : undefined),
    columns: [
      { key: 'visitNumber', label: 'Visit #', render: (r) => <Badge variant="light">{String(r.visitNumber)}</Badge> },
      {
        key: 'patientName',
        label: 'Patient',
        render: (r) => (
          <Text size="sm" fw={500}>
            {String(r.patientName ?? '—')}
          </Text>
        ),
      },
      { key: 'visitType', label: 'Type', render: (r) => formatEnum(String(r.visitType)) },
      { key: 'providerName', label: 'Provider', render: (r) => String(r.providerName ?? '—') },
      {
        key: 'startDatetime',
        label: 'Started',
        render: (r) => (r.startDatetime ? new Date(String(r.startDatetime)).toLocaleString() : '—'),
      },
      { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} kind="visit" /> },
    ],
  },
  requests: {
    key: 'requests',
    title: 'Clinical Requests',
    description: 'Prescriptions, lab, radiology and other test orders.',
    endpoint: '/requests',
    createLabel: 'New Clinical Request',
    createForm: RequestForm,
    actions: (row) => <RequestRowActions row={row} />,
    rowLink: (row) => (row.id ? `/emr/requests/${String(row.id)}` : undefined),
    columns: [
      { key: 'requestNumber', label: 'Request #', render: (r) => <Badge variant="light">{String(r.requestNumber)}</Badge> },
      {
        key: 'patientName',
        label: 'Patient',
        render: (r) => (
          <Text size="sm" fw={500}>
            {String(r.patientName ?? '—')}
          </Text>
        ),
      },
      { key: 'requestType', label: 'Type', render: (r) => formatEnum(String(r.requestType)) },
      { key: 'priority', label: 'Priority', render: (r) => <StatusBadge value={r.priority} kind="priority" /> },
      { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} kind="request" /> },
      {
        key: 'syncStatus',
        label: 'Sync',
        render: (r) => (
          <Stack gap={2}>
            <StatusBadge value={r.syncStatus} kind="sync" />
            {r.syncError ? (
              <Text size="xs" c="red" lineClamp={2} maw={200}>
                {String(r.syncError)}
              </Text>
            ) : null}
          </Stack>
        ),
      },
      {
        key: 'requestedAt',
        label: 'Requested',
        render: (r) => (r.requestedAt ? new Date(String(r.requestedAt)).toLocaleString() : '—'),
      },
    ],
  },
};
