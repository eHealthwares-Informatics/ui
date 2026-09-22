import {
  type Column,
  ColumnDataType,
  ColumnTypeFilters,
  EQUALS_WITH_OPTIONS,
} from '@/features/rxsoft/types';
import { PatientHoverCard } from '../components/shared/patient-hover-card';
import { StatusBadge, type StatusKind } from '../components/shared/status-badge';
import { toSelectData } from './emr-constants';

/** Column that renders a StatusBadge from the row value. */
export const badgeCol = (key: string, label: string, kind: StatusKind): Column => ({
  key,
  label,
  render: (row) => <StatusBadge value={row[key]} kind={kind} />,
});

/** EQUALS filter options built from an enum value list. */
export const enumFilter = (values: readonly string[]) => EQUALS_WITH_OPTIONS(toSelectData(values));

export const dateCol = (key: string, label: string): Column => ({
  key,
  label,
  dataType: ColumnDataType.DATE,
  filters: ColumnTypeFilters.DATE,
  render: (row) => String(row[key] ?? '—'),
});

export const dateTimeCol = (key: string, label: string): Column => ({
  key,
  label,
  render: (row) => (row[key] ? new Date(String(row[key])).toLocaleString() : '—'),
});

/** Patient name/MRN column with a hover card. No filters (use global search). */
export const patientCol = (key = 'patientName', label = 'Patient'): Column => ({
  key,
  label,
  render: (row) => (
    <PatientHoverCard
      mrn={String(row.patientId ?? '')}
      label={String(row.patientName ?? row.patientId ?? '—')}
    />
  ),
});
