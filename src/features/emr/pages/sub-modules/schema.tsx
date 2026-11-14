import { Badge, Text } from '@mantine/core';
import { type Column, type FieldGroup, ColumnTypeFilters } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';

export const SUB_MODULE_ICONS = [
  'Baby',
  'HeartPulse',
  'Stethoscope',
  'Bed',
  'Activity',
  'ClipboardList',
  'FileText',
  'Layers3',
] as const;

const iconOptions = SUB_MODULE_ICONS.map((icon) => ({ value: icon, label: icon }));

const columns: Column[] = [
  {
    key: 'code',
    label: 'Code',
    filters: ColumnTypeFilters.STRING,
    render: (row) => <Badge variant="light">{String(row.code ?? '—')}</Badge>,
  },
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'description',
    label: 'Description',
    render: (row) => (
      <Text size="sm" c="dimmed" lineClamp={2}>
        {String(row.description ?? '—')}
      </Text>
    ),
  },
  {
    key: 'featureCount',
    label: 'Features',
    render: (row) => String(row.featureCount ?? 0),
  },
  {
    key: 'sortOrder',
    label: 'Order',
    sortable: true,
  },
  {
    key: 'isActive',
    label: 'Active',
    render: (row) => (
      <Badge color={row.isActive ? 'teal' : 'gray'} variant="light">
        {row.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
];

const fieldGroups: FieldGroup[] = [
  {
    title: 'Module Details',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, col: 4 },
      { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
      {
        name: 'icon',
        label: 'Menu icon',
        type: 'select',
        options: iconOptions,
        col: 6,
      },
      { name: 'sortOrder', label: 'Sort order', type: 'number', col: 6 },
      { name: 'description', label: 'Description', type: 'textarea', col: 12 },
      { name: 'isActive', label: 'Active', type: 'switch', col: 3 },
    ],
  },
];

const compact = (values: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value != null));

export const subModulesConfig: ModelConfig = {
  id: 'sub-modules',
  title: 'Modules',
  description: 'Define the EMR menu groups. Features are created under Configuration → Features.',
  endpoint: '/sub-modules',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'sub-modules'],
  columns,
  createFieldGroups: fieldGroups,
  buildCreatePayload: compact,
  buildUpdatePayload: compact,
  defaultSort: { sortBy: 'sortOrder', sortOrder: 'asc' },
  detailPathBuilder: (row) => `/emr/modules/${String(row.id)}`,
  canDelete: true,
};
