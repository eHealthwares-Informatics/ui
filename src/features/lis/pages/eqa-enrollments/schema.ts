import type { Column, FieldGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  {
    key: 'program',
    label: 'Program',
    render: (row: any) => row.program?.name ?? row.programId ?? '-',
  },
  {
    key: 'testDefinition',
    label: 'Test',
    render: (row: any) => row.testDefinition?.name ?? row.testDefinitionId ?? '-',
  },
  { key: 'roundLabel', label: 'Round' },
  { key: 'status', label: 'Status' },
  { key: 'enrolledAt', label: 'Enrolled At' },
];

const createFieldGroups: FieldGroup[] = [
  {
    title: 'Enrollment Details',
    fields: [
      { name: 'programId', label: 'Program', type: 'async-select', searchParam: { endpoint: '/lis/eqa-programs', valueKey: 'id', labelKey: 'name' }, required: true, col: 6 },
      { name: 'testDefinitionId', label: 'Test', type: 'async-select', searchParam: { endpoint: '/lis/test-definitions', valueKey: 'id', labelKey: 'name' }, required: true, col: 6 },
      { name: 'roundLabel', label: 'Round Label', type: 'text', required: true, col: 6 },
      { name: 'notes', label: 'Notes', type: 'text', col: 12 },
    ],
  },
];

export const eqaEnrollmentsConfig: ModelConfig = {
  id: 'eqa-enrollments',
  title: 'EQA Enrollments',
  description: 'Test enrollments in EQA program rounds. Tracks status through sample receipt, result submission, and evaluation.',
  endpoint: '/lis/eqa-enrollments',
  columns,
  createFieldGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};