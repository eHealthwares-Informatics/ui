import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const columns: Column[] = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'addressLine1', label: 'Address' },
  { key: 'updatedAt', label: 'Updated' },
];

const createFields: Field[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'address', label: 'Address' },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    name: values.name,
    phone: values.phone || undefined,
    email: values.email || undefined,
    address: values.address || undefined,
  };
}

// Enables the row-level edit action (ui#785). PUT/PATCH /suppliers/:id now exist.
function buildUpdatePayload(values: Record<string, unknown>) {
  return {
    name: (values.name as string) || undefined,
    phone: (values.phone as string) || undefined,
    email: (values.email as string) || undefined,
    address: (values.address as string) || undefined,
  };
}

export const suppliersConfig: ModelConfig = {
  id: 'suppliers',
  title: 'Suppliers',
  description: 'Supplier management, purchase partner details and status tracking.',
  endpoint: '/suppliers',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
};
