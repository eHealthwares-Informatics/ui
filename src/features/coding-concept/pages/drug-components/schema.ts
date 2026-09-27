import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'name', label: 'Name' },
  { key: 'updatedAt', label: 'Updated' },
];

const createFields: Field[] = [{ name: 'name', label: 'Name', required: true }];

function buildCreatePayload(values: Record<string, unknown>) {
  return { name: values.name };
}

export const codedDrugComponentsConfig: ModelConfig = {
  id: 'coded-drug-components',
  title: 'Drug Components',
  description: 'Manage active ingredients and component lookup values.',
  endpoint: '/drug-components',
  columns,
  createFields,
  buildCreatePayload,
};
