import {
  type Column,
  ColumnDataType,
  ColumnTypeFilters,
  EQUALS_WITH_OPTIONS,
} from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { PaymentProvidersCell } from '../../components/shared/payment-providers-cell';
import { TagChips } from '../../components/shared/tag-chips';
import { badgeCol } from '../../lib/emr-columns';
import { GENDERS, toSelectData } from '../../lib/emr-constants';

const nameCol = (key: string, label: string): Column => ({
  key,
  label,
  render: (row) => [row.firstName, row.lastName].filter(Boolean).join(' ') || '—',
});

const columns: Column[] = [
  {
    key: 'patientId',
    label: 'MRN',
    render: (row) => String(row.patientId),
    filters: ColumnTypeFilters.STRING,
  },
  { ...nameCol('firstName', 'Name'), sortable: true },
  {
    ...badgeCol('gender', 'Gender', 'gender'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(GENDERS)),
  },
  { key: 'dateOfBirth', label: 'Date of Birth', render: (r) => String(r.dateOfBirth ?? '—') },
  { key: 'phone', label: 'Phone', render: (r) => String(r.phone ?? '—') },
  {
    key: 'paymentProviderIds',
    label: 'Payment Providers',
    render: (r) => <PaymentProvidersCell ids={r.paymentProviderIds as string[]} />,
  },
  {
    key: 'tags',
    label: 'Tags',
    render: (r) => <TagChips tags={r.tags as never} />,
  },
  {
    ...badgeCol('isActive', 'Active', 'active'),
    dataType: ColumnDataType.BOOLEAN,
    filters: ColumnTypeFilters.BOOLEAN,
  },
];

export const patientsConfig: ModelConfig = {
  id: 'patients',
  title: 'Patients',
  description: 'Search and manage patient demographic records.',
  endpoint: '/patients',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'patients'],
  columns,
  detailPathBuilder: (row) => `/emr/patients/${String(row.id)}`,
  canDelete: true,
};
