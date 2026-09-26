import { ColumnTypeFilters, EQUALS_WITH_OPTIONS, type Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { badgeCol, dateTimeCol, patientCol } from '../../lib/emr-columns';
import {
  MEDICATION_STATUSES,
  formatEnum,
  toSelectData,
} from '../../lib/emr-constants';

const columns: Column[] = [
  { key: 'medicationNumber', label: 'Medication #' },
  { ...patientCol() },
  { key: 'name', label: 'Medication' },
  {
    key: 'dose',
    label: 'Dose',
    render: (row) =>
      [row.dose, row.doseUnit].filter(Boolean).join(' ') || '—',
  },
  {
    key: 'route',
    label: 'Route',
    render: (row) => (row.route ? formatEnum(String(row.route)) : '—'),
  },
  { key: 'frequency', label: 'Frequency' },
  {
    ...badgeCol('status', 'Status', 'medication'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(MEDICATION_STATUSES)),
  },
  {
    key: 'administeredAt',
    label: 'Administered',
    render: (row) =>
      row.administeredAt ? new Date(String(row.administeredAt)).toLocaleString() : '—',
  },
  { key: 'administeredByName', label: 'Administered by' },
];

export const medicationsConfig: ModelConfig = {
  id: 'medications',
  title: 'Medications',
  description: 'Medication records created from prescription requests.',
  endpoint: '/medications',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'medications'],
  columns,
  canDelete: true,
};
