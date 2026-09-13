import type { ModelConfig } from '@/features/shared/model-schema';
import type { Column, Field } from '@/features/rxsoft/types';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'updatedAt', label: 'Updated' },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true },
  { name: 'name', label: 'Name', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
    description: values.description || undefined,
  };
}

export const dosageFormsConfig: ModelConfig = {
  id: 'dosage-forms',
  title: 'Dosage Forms',
  description: 'Manage dosage form reference values (tablet, injection, syrup, etc.).',
  endpoint: '/dosage-forms',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload: buildCreatePayload,
  canDelete: true,
};
