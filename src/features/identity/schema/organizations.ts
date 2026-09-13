import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { identityApi } from '@/lib/identity-api';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'isActive', label: 'Active' },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true },
  { name: 'name', label: 'Name', required: true },
  { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
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
