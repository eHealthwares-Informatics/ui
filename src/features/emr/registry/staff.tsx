import type { ModelConfig } from '@/features/shared/model-schema';
import { type Column, ColumnDataType, ColumnTypeFilters, EQUALS_WITH_OPTIONS } from '@/features/rxsoft/types';
import { emrApi } from '@/lib/emr-api';
import { STAFF_CATEGORIES, STAFF_ROLE_TYPES, toSelectData } from '../lib/emr-constants';
import { badgeCol } from './emr-common';

const columns: Column[] = [
  { key: 'staffNumber', label: 'Staff #', filters: ColumnTypeFilters.STRING },
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (row) => (
      <span>
        {[row.firstName, row.lastName, row.otherNames].filter(Boolean).join(' ') || '—'}
      </span>
    ),
  },
  {
    ...badgeCol('roleType', 'Role', 'staffRole'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(STAFF_ROLE_TYPES)),
  },
  {
    key: 'category',
    label: 'Category',
    render: (r) => String(r.category ?? '—'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(STAFF_CATEGORIES)),
  },
  { key: 'department', label: 'Department', render: (r) => String(r.department ?? '—') },
  { key: 'phone', label: 'Phone', render: (r) => String(r.phone ?? '—') },
  {
    ...badgeCol('isActive', 'Active', 'active'),
    dataType: ColumnDataType.BOOLEAN,
    filters: ColumnTypeFilters.BOOLEAN,
  },
];

export const staffConfig: ModelConfig = {
  id: 'staff',
  title: 'Staff',
  description: 'Manage hospital staff, roles, departments, and identity-user links.',
  endpoint: '/staff',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'staff'],
  columns,
  canDelete: true,
};