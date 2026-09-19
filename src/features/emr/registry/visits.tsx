import type { ModelConfig } from '@/features/shared/model-schema';
import { type Column, EQUALS_WITH_OPTIONS } from '@/features/rxsoft/types';
import { emrApi } from '@/lib/emr-api';
import { VISIT_STATUSES, VISIT_TYPES, formatEnum, toSelectData } from '../lib/emr-constants';
import { badgeCol, dateTimeCol, patientCol } from './emr-common';

const columns: Column[] = [
  { key: 'visitNumber', label: 'Visit #' },
  { ...patientCol() },
  {
    key: 'visitType',
    label: 'Type',
    render: (r) => formatEnum(String(r.visitType)),
    filters: EQUALS_WITH_OPTIONS(toSelectData(VISIT_TYPES)),
  },
  { key: 'providerName', label: 'Provider', render: (r) => String(r.providerName ?? '—') },
  { ...dateTimeCol('startDatetime', 'Started') },
  { ...badgeCol('status', 'Status', 'visit'), filters: EQUALS_WITH_OPTIONS(toSelectData(VISIT_STATUSES)) },
];

export const visitsConfig: ModelConfig = {
  id: 'visits',
  title: 'Visits',
  description: 'Active and historical patient visits.',
  endpoint: '/visits',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'visits'],
  columns,
  detailPathBuilder: (row) => `/emr/visits/${String(row.id)}`,
  canDelete: true,
};