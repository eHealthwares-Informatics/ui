import { Button } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  {
    key: 'permissionCodes',
    label: 'Permissions',
    render: (row) => ((row.permissionCodes as string[] | undefined) ?? []).join(', '),
  },
  {
    key: 'actions',
    label: '',
    render: (row) => (
      <Button
        component={Link}
        to={`/roles/${String(row.id)}/permissions`}
        size="xs"
        variant="light"
      >
        Permissions
      </Button>
    ),
  },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true, placeholder: 'manager' },
  { name: 'name', label: 'Name', required: true, placeholder: 'Manager' },
  {
    name: 'permissionCodes',
    label: 'Permissions',
    type: 'permission-picker',
  },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
    permissionCodes: toPermissionCodes(values),
  };
}

function buildUpdatePayload(values: Record<string, unknown>, _row?: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  if (values.code) {
    payload.code = values.code;
  }
  if (values.name) {
    payload.name = values.name;
  }
  if (values.permissionCodes !== undefined) {
    payload.permissionCodes = toPermissionCodes(values);
  }
  return payload;
}

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

export const rolesConfig: ModelConfig = {
  id: 'roles',
  title: 'Roles',
  description: 'Role and permission governance for enterprise RBAC control.',
  endpoint: '/roles',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
