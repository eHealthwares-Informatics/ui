import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'index', label: 'Index' },
  { key: 'active', label: 'Active' },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', type: 'text', col: 4, generateCode: { scope: 'priorities' } },
  { name: 'name', label: 'Name', type: 'text', required: true, col: 6 },
  { name: 'index', label: 'Index', type: 'number', col: 2 },
  { name: 'active', label: 'Active', type: 'switch', col: 3 },
];

export const prioritiesConfig: ModelConfig = {
  id: 'priorities',
  title: 'Priorities',
  description: 'Routine, urgent and STAT processing priorities.',
  endpoint: '/lis/priorities',
  columns,
  createFields,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};
