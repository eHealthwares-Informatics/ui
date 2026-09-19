import type { ModelConfig } from '@/features/shared/model-schema';
import { type Column, type FieldGroup, ColumnDataType, ColumnTypeFilters } from '@/features/rxsoft/types';
import { emrApi } from '@/lib/emr-api';
import { DEPARTMENT_TYPES, toSelectData } from '../lib/emr-constants';
import { badgeCol, enumFilter } from './emr-common';

const columns: Column[] = [
  { key: 'code', label: 'Code', filters: ColumnTypeFilters.STRING },
  { key: 'name', label: 'Name', sortable: true },
  { ...badgeCol('departmentType', 'Type', 'departmentType'), filters: enumFilter(DEPARTMENT_TYPES) },
  { key: 'locationId', label: 'Site (Location)', render: (r) => String(r.locationId ?? '—') },
  { key: 'description', label: 'Description', render: (r) => String(r.description ?? '—') },
  {
    ...badgeCol('isActive', 'Active', 'active'),
    dataType: ColumnDataType.BOOLEAN,
    filters: ColumnTypeFilters.BOOLEAN,
  },
];

const fieldGroups: FieldGroup[] = [
  {
    title: 'Department Details',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, col: 4 },
      { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
      {
        name: 'departmentType',
        label: 'Type',
        type: 'select',
        options: toSelectData(DEPARTMENT_TYPES),
        col: 6,
      },
      { name: 'description', label: 'Description', type: 'textarea', col: 12 },
      { name: 'isActive', label: 'Active', type: 'switch', col: 3 },
    ],
  },
];

const compact = (values: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== '' && value != null),
  );

export const departmentsConfig: ModelConfig = {
  id: 'departments',
  title: 'Departments',
  description: 'Manage organisational departments.',
  endpoint: '/departments',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'departments'],
  columns,
  createFieldGroups: fieldGroups,
  buildCreatePayload: compact,
  buildUpdatePayload: compact,
  defaultState: { departmentType: 'OPD', isActive: true },
  canDelete: true,
};