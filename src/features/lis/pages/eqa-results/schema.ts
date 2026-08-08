import type { Column, FieldGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  {
    key: 'enrollment',
    label: 'Enrollment',
    render: (row: any) => row.enrollment?.roundLabel ?? row.enrollmentId ?? '-',
  },
  { key: 'sampleNumber', label: 'Sample' },
  { key: 'value', label: 'Submitted Value' },
  { key: 'expectedValue', label: 'Expected' },
  { key: 'zScore', label: 'Z-Score' },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'submittedAt', label: 'Submitted At' },
];

const createFieldGroups: FieldGroup[] = [
  {
    title: 'EQA Result',
    fields: [
      { name: 'enrollmentId', label: 'Enrollment', type: 'async-select', searchParam: { endpoint: '/lis/eqa-enrollments', valueKey: 'id', labelKey: 'roundLabel' }, required: true, col: 6 },
      { name: 'sampleNumber', label: 'Sample Number', type: 'text', required: true, col: 6 },
      { name: 'value', label: 'Value', type: 'text', col: 12 },
    ],
  },
];

export const eqaResultsConfig: ModelConfig = {
  id: 'eqa-results',
  title: 'EQA Results',
  description: 'Result submissions for EQA program samples, with performance evaluation including z-scores and pass/fail status.',
  endpoint: '/lis/eqa-results',
  columns,
  createFieldGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};