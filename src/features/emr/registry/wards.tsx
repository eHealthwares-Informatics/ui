import type { ModelConfig } from '@/features/shared/model-schema';
import { type Column, type FieldGroup, ColumnDataType, ColumnTypeFilters } from '@/features/rxsoft/types';
import { emrApi } from '@/lib/emr-api';
import { WARD_TYPES, toSelectData } from '../lib/emr-constants';
import { badgeCol, enumFilter } from './emr-common';

const columns: Column[] = [
  {
    key: 'code',
    label: 'Code',
    render: (row) => <>{String(row.code)}</>,
    filters: ColumnTypeFilters.STRING,
  },
  { key: 'name', label: 'Name', sortable: true },
  { ...badgeCol('wardType', 'Type', 'wardType'), filters: enumFilter(WARD_TYPES) },
  {
    key: 'departmentType',
    label: 'Department',
    render: (row) => String(row.departmentType ?? row.departmentId ?? '—'),
  },
  {
    ...badgeCol('isActive', 'Active', 'active'),
    dataType: ColumnDataType.BOOLEAN,
    filters: ColumnTypeFilters.BOOLEAN,
  },
];

const fieldGroups: FieldGroup[] = [
  {
    title: 'Ward Details',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, col: 4 },
      { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
      {
        name: 'wardType',
        label: 'Ward type',
        type: 'select',
        options: toSelectData(WARD_TYPES),
        required: true,
        col: 4,
      },
      { name: 'departmentType', label: 'Department type', type: 'text', col: 4 },
      { name: 'departmentId', label: 'Department id', type: 'text', col: 4 },
      { name: 'description', label: 'Description', type: 'textarea', col: 12 },
      { name: 'isActive', label: 'Active', type: 'switch', col: 3 },
    ],
  },
];

const compact = (values: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== '' && value != null),
  );

export const wardsConfig: ModelConfig = {
  id: 'wards',
  title: 'Wards',
  description: 'Manage inpatient wards.',
  endpoint: '/wards',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'wards'],
  columns,
  createFieldGroups: fieldGroups,
  buildCreatePayload: compact,
  buildUpdatePayload: compact,
  defaultState: { wardType: 'GENERAL', isActive: true },
  canDelete: true,
};