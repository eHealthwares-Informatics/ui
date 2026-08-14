import type { Column, FieldGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'active', label: 'Active' },
];

const createFieldGroups: FieldGroup[] = [
  {
    title: 'Category Details',
    fields: [
      { name: 'code', label: 'Code', type: 'text', col: 4, generateCode: { scope: 'test-categories' } },
      { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
      { name: 'description', label: 'Description', type: 'text', col: 12 },
      { name: 'active', label: 'Active', type: 'switch', col: 3 },
    ],
  },
];

export const testCategoriesConfig: ModelConfig = {
  id: 'test-categories',
  title: 'Test Categories',
  description: 'Test grouping and report categories.',
  endpoint: '/lis/test-categories',
  columns,
  createFieldGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};
