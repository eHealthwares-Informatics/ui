import type { Column, Field } from '@/features/rxsoft/types';
import { flattenOptionObjects } from '@/features/lis/schema/flatten-payload';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'active', label: 'Active' },
];

const createFields: Field[] = [
  { name: 'name', label: 'Name', type: 'text', required: true, col: 6 },
  { name: 'description', label: 'Description', type: 'text', col: 12 },
  { name: 'active', label: 'Active', type: 'switch', col: 3 },
];

export const programsConfig: ModelConfig = {
  id: 'programs',
  title: 'Programs',
  description: 'Health programs and funded initiatives.',
  endpoint: '/lis/programs',
  columns,
  createFields,
  // Select fields store {value,label} option objects — flatten (see flatten-payload.ts).
  buildCreatePayload: (v) => flattenOptionObjects(v),
  buildUpdatePayload: (v) => flattenOptionObjects(v),
  canDelete: true,
};
