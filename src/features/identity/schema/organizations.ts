import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { identityApi } from '@/lib/identity-api';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'domain', label: 'Domain' },
  { key: 'isActive', label: 'Active' },
];

// `domain` maps a storefront/admin host to this organisation: identity resolves
// Host -> organisationId, and the storefront uses it as its tenant.
const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true },
  { name: 'name', label: 'Name', required: true },
  {
    name: 'domain',
    label: 'Domain',
    placeholder: 'shop.example.com',
  },
  { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
    ...(values.domain ? { domain: String(values.domain).trim().toLowerCase() } : {}),
    isActive: values.isActive,
  };
}

function buildUpdatePayload(values: Record<string, unknown>, _row?: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  if ('code' in values && values.code) {
    payload.code = values.code;
  }
  if ('name' in values && values.name) {
    payload.name = values.name;
  }
  if ('domain' in values) {
    // Empty string clears the mapping (the API accepts null for that).
    payload.domain = values.domain
      ? String(values.domain).trim().toLowerCase()
      : null;
  }
  if ('isActive' in values) {
    payload.isActive = values.isActive;
  }
  return payload;
}

export const identityOrganizationsConfig: ModelConfig = {
  id: 'identity-organizations',
  title: 'Organizations',
  description: 'Tenant-level organization records and activation status.',
  endpoint: '/organizations',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
  apiProvider: identityApi,
};
