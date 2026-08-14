import type { Column, FieldGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'provider', label: 'Provider' },
  { key: 'active', label: 'Active', render: (row: any) => (row.active ? 'Yes' : 'No') },
];

const createFieldGroups: FieldGroup[] = [
  {
    title: 'Program Details',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, col: 4, generateCode: { scope: 'eqa-programs' } },
      { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
      { name: 'provider', label: 'Provider', type: 'text', col: 6 },
      { name: 'active', label: 'Active', type: 'switch', col: 6 },
      { name: 'description', label: 'Description', type: 'text', col: 12 },
    ],
  },
];

export const eqaProgramsConfig: ModelConfig = {
  id: 'eqa-programs',
  title: 'EQA Programs',
  description: 'External Quality Assessment programs the laboratory participates in, such as CAP, RIQAS, and NEQAS.',
  endpoint: '/lis/eqa-programs',
  columns,
  createFieldGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};