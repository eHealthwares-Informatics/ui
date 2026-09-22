import {
  type Column,
  type FieldGroup,
  ColumnDataType,
  ColumnTypeFilters,
} from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { badgeCol, enumFilter } from '../../lib/emr-columns';
import { DEPARTMENT_TYPES, toSelectData } from '../../lib/emr-constants';

const toOptionValue = (value: unknown): unknown => {
  const option = value as { value?: string } | undefined;
  return option?.value ?? value;
};

const columns: Column[] = [
  { key: 'code', label: 'Code', filters: ColumnTypeFilters.STRING },
  { key: 'name', label: 'Name', sortable: true },
  {
    ...badgeCol('departmentType', 'Type', 'departmentType'),
    filters: enumFilter(DEPARTMENT_TYPES),
  },
  {
    key: 'parent',
    label: 'Parent',
    render: (r) => {
      const parent = r.parent as Record<string, unknown> | null | undefined;
      return parent ? `${String(parent.name)} (${String(parent.code)})` : '—';
    },
  },
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
      {
        name: 'parentId',
        label: 'Parent department (optional)',
        type: 'async-select',
        searchParam: { endpoint: '/departments', valueKey: 'id', labelKey: 'name', minChars: 1 },
        col: 6,
      },
      { name: 'description', label: 'Description', type: 'textarea', col: 12 },
      { name: 'isActive', label: 'Active', type: 'switch', col: 3 },
    ],
  },
];

const compact = (values: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value != null));

const withParentValue = (values: Record<string, unknown>) => {
  const v = compact(values);
  v.parentId = toOptionValue(v.parentId);
  return v;
};

export const departmentsConfig: ModelConfig = {
  id: 'departments',
  title: 'Departments',
  description: 'Manage organisational departments.',
  endpoint: '/departments',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'departments'],
  columns,
  createFieldGroups: fieldGroups,
  buildFormState: (row) => ({
    code: String(row.code ?? ''),
    name: String(row.name ?? ''),
    departmentType: String(row.departmentType ?? 'OPD'),
    parentId: row.parent
      ? {
          value: String((row.parent as Record<string, unknown>).id),
          label: String((row.parent as Record<string, unknown>).name),
        }
      : null,
    description: String(row.description ?? ''),
    isActive: Boolean(row.isActive),
  }),
  buildCreatePayload: withParentValue,
  buildUpdatePayload: withParentValue,
  defaultState: { departmentType: 'OPD', isActive: true },
  canDelete: true,
};
