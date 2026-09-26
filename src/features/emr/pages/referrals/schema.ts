import { ColumnTypeFilters, EQUALS_WITH_OPTIONS, type Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { badgeCol, dateTimeCol, patientCol } from '../../lib/emr-columns';
import {
  REFERRAL_PRIORITIES,
  REFERRAL_STATUSES,
  formatEnum,
  toSelectData,
} from '../../lib/emr-constants';

const columns: Column[] = [
  { key: 'referralNumber', label: 'Referral #' },
  { ...patientCol() },
  { key: 'referringProviderName', label: 'Referred by' },
  { key: 'specialistProviderName', label: 'Addressed to' },
  {
    key: 'specialty',
    label: 'Specialty',
    render: (row) => (row.specialty ? formatEnum(String(row.specialty)) : '—'),
  },
  {
    ...badgeCol('priority', 'Priority', 'priority'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(REFERRAL_PRIORITIES)),
  },
  {
    ...badgeCol('status', 'Status', 'referral'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(REFERRAL_STATUSES)),
  },
  {
    key: 'createdAt',
    label: 'Created',
    dataType: 'date' as never,
    sortable: true,
    filters: ColumnTypeFilters.DATE,
    render: (row) => (row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'),
  },
  { ...dateTimeCol('completedAt', 'Completed') },
];

export const referralsConfig: ModelConfig = {
  id: 'referrals',
  title: 'Referrals',
  description: 'Specialist referrals tied to an encounter (incoming and outgoing).',
  endpoint: '/referrals',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'referrals'],
  columns,
  canDelete: true,
};
