import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'domain', label: 'Domain' },
  { key: 'sortOrder', label: 'Sort' },
  { key: 'active', label: 'Active' },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', type: 'text', required: true, col: 4 },
  { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
  {
    name: 'domain',
    label: 'Domain',
    type: 'select',
    options: [
      { value: 'ORDER', label: 'Order' },
      { value: 'SAMPLE', label: 'Sample' },
      { value: 'RESULT', label: 'Result' },
    ],
    required: true,
    col: 4,
  },
  { name: 'description', label: 'Description', type: 'text', col: 8 },
  { name: 'sortOrder', label: 'Sort Order', type: 'number', col: 3 },
  { name: 'active', label: 'Active', type: 'switch', col: 3 },
];

export const statusesConfig: ModelConfig = {
  id: 'statuses',
  title: 'Statuses',
  description: 'Workflow statuses for orders, samples, and results.',
  endpoint: '/lis/statuses',
  columns,
  createFields,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};
