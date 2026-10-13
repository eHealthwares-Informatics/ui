import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'updatedAt', label: 'Updated' },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code' },
  { name: 'name', label: 'Name', required: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
  };
}

// Enables the row-level edit action (ui#785). PUT/PATCH /manufacturers/:id
// already exist; without this the edit modal was unreachable.
function buildUpdatePayload(values: Record<string, unknown>) {
  return {
    code: values.code ?? undefined,
    name: (values.name as string) || undefined,
  };
}

export const manufacturersConfig: ModelConfig = {
  id: 'manufacturers',
  title: 'Manufacturers',
  description: 'Manage medicine manufacturers and supplier production sources.',
  endpoint: '/manufacturers',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
  metricsEndpoint: '/manufacturers/metrics',
  metricsConfig: {
    endpoint: '/manufacturers/metrics',
    items: (data) => {
      const lastCreated = (data as any)?.lastCreated ?? data;
      if (!lastCreated?.code) {
        return [];
      }
      return [{ label: 'Last Created', value: lastCreated.code, icon: 'Package', color: 'blue' }];
    },
  },
};
