import {
  type Column,
  type FieldGroup,
  ColumnDataType,
  ColumnTypeFilters,
} from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { DepartmentCell } from '../../../components/shared/department-cell';
import { badgeCol, enumFilter } from '../../../lib/emr-columns';
import { WARD_TYPES, toSelectData } from '../../../lib/emr-constants';

const toOptionValue = (value: unknown): unknown => {
  const option = value as { value?: string } | undefined;
  return option?.value ?? value;
};

const columns: Column[] = [
  {
    key: 'code',
    label: 'Code',
    render: (row) => String(row.code),
    filters: ColumnTypeFilters.STRING,
  },
  { key: 'name', label: 'Name', sortable: true },
  { ...badgeCol('wardType', 'Type', 'wardType'), filters: enumFilter(WARD_TYPES) },
  {
    key: 'departmentId',
    label: 'Department',
    render: (row) => <DepartmentCell departmentId={row.departmentId as string | null} />,
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
      {
        name: 'departmentId',
        label: 'Department',
        type: 'async-select',
        searchParam: { endpoint: '/departments', valueKey: 'id', labelKey: 'name', minChars: 1 },
        col: 8,
      },
      { name: 'description', label: 'Description', type: 'textarea', col: 12 },
      { name: 'isActive', label: 'Active', type: 'switch', col: 3 },
    ],
  },
];

const compact = (values: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value != null));

const withDepartmentValue = (values: Record<string, unknown>) => {
  const v = compact(values);
  v.departmentId = toOptionValue(v.departmentId);
  return v;
};

export const wardsConfig: ModelConfig = {
  id: 'wards',
  title: 'Wards',
  description: 'Manage inpatient wards.',
  endpoint: '/wards',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'wards'],
  columns,
  createFieldGroups: fieldGroups,
  buildFormState: (row) => ({
    code: String(row.code ?? ''),
    name: String(row.name ?? ''),
    wardType: String(row.wardType ?? 'GENERAL'),
    departmentId: row.departmentId
      ? { value: String(row.departmentId), label: String(row.departmentType ?? row.departmentId) }
      : null,
    description: String(row.description ?? ''),
    isActive: Boolean(row.isActive),
  }),
  buildCreatePayload: withDepartmentValue,
  buildUpdatePayload: withDepartmentValue,
  defaultState: { wardType: 'GENERAL', isActive: true },
  canDelete: true,
};
