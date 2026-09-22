import {
  type Column,
  ColumnDataType,
  ColumnTypeFilters,
  EQUALS_WITH_OPTIONS,
} from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { badgeCol, dateCol, patientCol } from '../../lib/emr-columns';
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  PRIORITIES,
  formatEnum,
  toSelectData,
} from '../../lib/emr-constants';

const appointmentPatientCol: Column = {
  ...patientCol('patientName', 'Patient'),
  dataType: ColumnDataType.STRING,
  filters: ColumnTypeFilters.STRING,
};

const columns: Column[] = [
  { key: 'appointmentNumber', label: 'Appt #' },
  appointmentPatientCol,
  {
    key: 'appointmentType',
    label: 'Type',
    render: (r) => formatEnum(String(r.appointmentType)),
    filters: EQUALS_WITH_OPTIONS(toSelectData(APPOINTMENT_TYPES)),
  },
  dateCol('date', 'Date'),
  { key: 'startTime', label: 'Start' },
  { key: 'providerName', label: 'Provider', render: (r) => String(r.providerName ?? '—') },
  {
    ...badgeCol('priority', 'Priority', 'priority'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(PRIORITIES)),
  },
  {
    ...badgeCol('status', 'Status', 'appointment'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(APPOINTMENT_STATUSES)),
  },
  {
    key: 'createdAt',
    label: 'Created',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
    sortable: true,
    render: (row) => (row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'),
  },
];

export const appointmentsConfig: ModelConfig = {
  id: 'appointments',
  title: 'Appointments',
  description: 'Schedule and manage patient appointments.',
  endpoint: '/appointments',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'appointments'],
  columns,
  defaultSort: { sortBy: 'date', sortOrder: 'desc' },
  canDelete: true,
};
