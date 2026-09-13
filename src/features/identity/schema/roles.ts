import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { identityApi } from '@/lib/identity-api';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  {
    key: 'permissionCodes',
    label: 'Permissions',
    render: (row) => ((row.permissionCodes as string[] | undefined) ?? []).join(', '),
  },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true, placeholder: 'manager' },
  { name: 'name', label: 'Name', required: true, placeholder: 'Manager' },
  { name: 'description', label: 'Description', type: 'textarea' },
  {
    name: 'permissionCodes',
    label: 'Permissions',
    type: 'permission-picker',
  },
];

function toPermissionCodes(values: Record<string, unknown>): string[] {
  if (Array.isArray(values.permissionCodes)) {
    return values.permissionCodes.map(String);
  }
  // Backward compatibility with legacy comma-separated input
  return String(values.permissionCodes ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
    description: values.description || undefined,
    permissionCodes: toPermissionCodes(values),
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
  if ('description' in values) {
    payload.description = values.description || undefined;
  }
  if ('permissionCodes' in values) {
    payload.permissionCodes = toPermissionCodes(values);
  }
  return payload;
}

export const identityRolesConfig: ModelConfig = {
  id: 'identity-roles',
  title: 'Roles',
  description: 'Role and permission governance for enterprise RBAC control.',
  endpoint: '/roles',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
  buildFormState: (row) => ({
    code: row.code,
    name: row.name,
    description: row.description,
    permissionCodes: (row.permissionCodes as string[] | undefined) ?? [],
  }),
  apiProvider: identityApi,
};
