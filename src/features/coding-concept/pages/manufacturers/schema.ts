import type { ModelConfig } from '@/features/shared/model-schema';
import type { Column, Field } from '@/features/rxsoft/types';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'country', label: 'Country' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'updatedAt', label: 'Updated' },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true, col: 6 },
  { name: 'name', label: 'Name', required: true, col: 6 },
  { name: 'country', label: 'Country', col: 6 },
  { name: 'phone', label: 'Phone', col: 6 },
  { name: 'email', label: 'Email', col: 6 },
  { name: 'website', label: 'Website', col: 6 },
  { name: 'address', label: 'Address', type: 'textarea', col: 12 },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
    country: values.country || undefined,
    phone: values.phone || undefined,
    email: values.email || undefined,
    website: values.website || undefined,
    address: values.address || undefined,
  };
}

export const manufacturersConfig: ModelConfig = {
  id: 'manufacturers',
  title: 'Manufacturers',
  description: 'Manage drug manufacturers and their contact information.',
  endpoint: '/manufacturers',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload: buildCreatePayload,
  canDelete: true,
};
