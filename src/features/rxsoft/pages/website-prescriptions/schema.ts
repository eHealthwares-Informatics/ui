import type { ModelConfig } from '../../../shared/model-schema';
import { ColumnDataType, ColumnTypeFilters, FILTERS, type Column } from '../../types';

export const PRESCRIPTION_STATUSES = [
  'Pending',
  'Under Review',
  'Approved',
  'Rejected',
  'Fulfilled',
] as const;

export const prescriptionStatusColors: Record<string, string> = {
  Pending: 'gray',
  'Under Review': 'yellow',
  Approved: 'green',
  Rejected: 'red',
  Fulfilled: 'blue',
};

const columns: Column[] = [
  { key: 'name', label: 'Name', filters: ColumnTypeFilters.STRING },
  { key: 'phone', label: 'Phone', filters: ColumnTypeFilters.STRING },
  { key: 'email', label: 'Email', filters: ColumnTypeFilters.STRING },
  {
    key: 'status',
    label: 'Status',
    filters: [FILTERS.EQUALS, FILTERS.NOT_EQUALS],
  },
  {
    key: 'createdAt',
    label: 'Date',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
    sortable: true,
  },
];

export const prescriptionsConfig: ModelConfig = {
  id: 'website-prescriptions',
  title: 'Prescriptions',
  description: 'Review and process prescription submissions from the website.',
  endpoint: '/website/admin/prescriptions',
  columns,
  canDelete: false,
  defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
};
