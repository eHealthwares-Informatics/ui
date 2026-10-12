import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, FieldGroup } from '../../types';

export const columns: Column[] = [
  { key: 'name', label: 'Name' },
  { key: 'updatedAt', label: 'Updated' },
];

export const createFieldGroups: FieldGroup[] = [
  {
    title: 'Drug Component',
    fields: [{ name: 'name', label: 'Name', required: true }],
  },
];

export const buildPayload = (values: Record<string, unknown>) => ({
  name: values.name,
});

export const drugComponentsConfig: ModelConfig = {
  id: 'drug-components',
  title: 'Drug Components',
  description: 'Manage active ingredients and component lookup values.',
  endpoint: '/drug-components',
  columns,
  createFieldGroups,
  buildCreatePayload: buildPayload,
  canExport: true,
  csvEndpoint: '/drug-components/export',
};
