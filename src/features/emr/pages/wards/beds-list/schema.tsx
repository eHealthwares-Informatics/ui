import { type Column, type FieldGroup, ColumnTypeFilters } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { WardCell } from '../../../components/wards/ward-cell';
import { badgeCol, enumFilter } from '../../../lib/emr-columns';
import { BED_STATUSES, BED_TYPES, toSelectData } from '../../../lib/emr-constants';

const columns: Column[] = [
  {
    key: 'code',
    label: 'Bed Code',
    render: (row) => String(row.code),
    filters: ColumnTypeFilters.STRING,
  },
  {
    key: 'wardId',
    label: 'Ward',
    render: (row) => <WardCell wardId={String(row.wardId ?? '')} />,
  },
  { ...badgeCol('bedType', 'Type', 'bedType'), filters: enumFilter(BED_TYPES) },
  { ...badgeCol('status', 'Status', 'bedStatus'), filters: enumFilter(BED_STATUSES) },
  {
    key: 'notes',
    label: 'Notes',
    render: (row) => String(row.notes ?? '—'),
  },
];

const fieldGroups: FieldGroup[] = [
  {
    title: 'Bed Details',
    fields: [
      {
        name: 'wardId',
        label: 'Ward',
        type: 'async-select',
        searchParam: { endpoint: '/wards', valueKey: 'id', labelKey: 'name', minChars: 1 },
        required: true,
        col: 6,
      },
      { name: 'code', label: 'Bed code', type: 'text', required: true, col: 6 },
      {
        name: 'bedType',
        label: 'Bed type',
        type: 'select',
        options: toSelectData(BED_TYPES),
        col: 6,
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: toSelectData(BED_STATUSES),
        col: 6,
      },
      { name: 'notes', label: 'Notes', type: 'textarea', col: 12 },
    ],
  },
];

const compact = (values: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value != null));

const toOptionValue = (value: unknown): unknown => {
  const option = value as { value?: string } | undefined;
  return option?.value ?? value;
};

export const bedsConfig: ModelConfig = {
  id: 'beds',
  title: 'Beds',
  description: 'Manage beds within wards and their status.',
  endpoint: '/beds',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'beds'],
  columns,
  createFieldGroups: fieldGroups,
  buildFormState: (row) => ({
    wardId: row.wardId ? { value: String(row.wardId), label: '' } : null,
    code: String(row.code ?? ''),
    bedType: String(row.bedType ?? 'STANDARD'),
    status: String(row.status ?? 'AVAILABLE'),
    notes: String(row.notes ?? ''),
  }),
  buildCreatePayload: (values) => {
    const v = compact(values);
    v.wardId = toOptionValue(v.wardId);
    return v;
  },
  buildUpdatePayload: (values) => {
    const v = compact(values);
    v.wardId = toOptionValue(v.wardId);
    return v;
  },
  defaultState: { bedType: 'STANDARD', status: 'AVAILABLE' },
  canDelete: true,
};
