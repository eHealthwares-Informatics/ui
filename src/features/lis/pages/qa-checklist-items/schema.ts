import type { Column, FieldGroup, Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const QA_CATEGORIES: Option[] = [
  { label: 'Order Entry', value: 'ORDER_ENTRY' },
  { label: 'Specimen', value: 'SPECIMEN' },
  { label: 'Test', value: 'TEST' },
  { label: 'Result Entry', value: 'RESULT_ENTRY' },
  { label: 'Validation', value: 'VALIDATION' },
];

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'required', label: 'Required' },
  { key: 'sortOrder', label: 'Sort Order' },
  { key: 'active', label: 'Active' },
];

const createFieldGroups: FieldGroup[] = [
  {
    title: 'Checklist Item Details',
    fields: [
      { name: 'code', label: 'Code', type: 'text', col: 4 },
      { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
      { name: 'category', label: 'Category', type: 'select', col: 4, options: QA_CATEGORIES },
      { name: 'sortOrder', label: 'Sort Order', type: 'number', col: 4 },
      { name: 'required', label: 'Required', type: 'switch', col: 4 },
      { name: 'description', label: 'Description', type: 'text', col: 12 },
      { name: 'active', label: 'Active', type: 'switch', col: 3 },
    ],
  },
];

export const qaChecklistItemsConfig: ModelConfig = {
  id: 'qa-checklist-items',
  title: 'QA Checklist',
  description: 'Configurable QA verification items used during order QA step.',
  endpoint: '/lis/qa-checklist-items',
  columns,
  createFieldGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};
