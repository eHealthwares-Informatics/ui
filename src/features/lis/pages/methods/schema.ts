import type { Column, FieldGroup, TabGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'active', label: 'Active' },
];

const tabGroups: TabGroup[] = [
  {
    title: 'Details',
    value: 'details',
    fieldGroups: [
      {
        title: 'Method',
        fields: [
          { name: 'code', label: 'Code', type: 'text', col: 4, generateCode: { scope: 'methods' } },
          { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
          { name: 'description', label: 'Description', type: 'text', col: 12 },
          { name: 'active', label: 'Active', type: 'switch', col: 3 },
        ],
      },
    ],
  },
];

export const methodsConfig: ModelConfig = {
  id: 'methods',
  title: 'Methods',
  description: 'Test methodologies and measurement principles.',
  endpoint: '/lis/methods',
  columns,
  tabGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};
