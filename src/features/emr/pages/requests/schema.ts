import { ColumnDataType, ColumnTypeFilters, EQUALS_WITH_OPTIONS, type Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { badgeCol, dateTimeCol, patientCol } from '../../lib/emr-columns';
import {
  PRIORITIES,
  REQUEST_STATUSES,
  REQUEST_TYPES,
  SYNC_STATUSES,
  formatEnum,
  toSelectData,
} from '../../lib/emr-constants';

const columns: Column[] = [
  { key: 'requestNumber', label: 'Request #' },
  { ...patientCol() },
  {
    key: 'requestType',
    label: 'Type',
    render: (r) => formatEnum(String(r.requestType)),
    filters: EQUALS_WITH_OPTIONS(toSelectData(REQUEST_TYPES)),
  },
  {
    ...badgeCol('priority', 'Priority', 'priority'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(PRIORITIES)),
  },
  {
    ...badgeCol('status', 'Status', 'request'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(REQUEST_STATUSES)),
  },
  {
    ...badgeCol('syncStatus', 'Sync', 'sync'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(SYNC_STATUSES)),
  },
  {
    ...dateTimeCol('requestedAt', 'Requested'),
    sortable: true,
    filters: ColumnTypeFilters.DATE,
  },
  {
    key: 'createdAt',
    label: 'Created',
    dataType: ColumnDataType.DATE,
    sortable: true,
    filters: ColumnTypeFilters.DATE,
    render: (row) => (row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'),
  },
];

export const requestsConfig: ModelConfig = {
  id: 'requests',
  title: 'Clinical Requests',
  description: 'Prescriptions, lab, radiology and other test orders.',
  endpoint: '/requests',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'requests'],
  columns,
  detailPathBuilder: (row) => `/emr/requests/${String(row.id)}`,
  canDelete: true,
};
