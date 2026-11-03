import { Button } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'organisationId', label: 'Organisation' },
  {
    key: 'permissionCodes',
    label: 'Permissions',
    render: (row) => ((row.permissionCodes as string[] | undefined) ?? []).join(', '),
  },
  {
    key: 'jwtExpirySeconds',
    label: 'JWT Expiry (seconds)',
    render: (row) => (row.jwtExpirySeconds as number | null | undefined) ?? '—',
  },
  {
    key: 'actions',
    label: '',
    render: (row) => (
      <Button
        component={Link}
        to={`/rxsoft/roles/${String(row.id)}/permissions`}
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
  { name: 'description', label: 'Description', type: 'textarea' },
  {
    name: 'permissionCodes',
    label: 'Permissions',
    type: 'permission-picker',
  },
  {
    name: 'jwtExpirySeconds',
    label: 'JWT Expiry (seconds)',
    type: 'number',
    min: 1,
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
    jwtExpirySeconds: values.jwtExpirySeconds,
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
  if (values.jwtExpirySeconds !== undefined) {
    payload.jwtExpirySeconds = values.jwtExpirySeconds;
  }
  return payload;
}

/**
 * Shared Role model config used by both /identity/roles and /rxsoft/roles.
 *
 * Lives in the Admin Module so both identity and rxsoft role pages render the
 * same schema and component. organisationId and jwtExpirySeconds are included
 * so both surfaces load and display organisation-scoped role metadata and the
 * JWT expiry (seconds) claim.
 */
export const rolesConfig: ModelConfig = {
  id: 'identity-roles',
  title: 'Roles',
  description: 'Role and permission governance for enterprise RBAC control.',
  endpoint: '/roles',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
  // ACTIONS gating — codes mirror identity's catalog (rxsoft.identity.role.*).
  permissions: {
    create: 'rxsoft.identity.role.create',
    update: 'rxsoft.identity.role.update',
    delete: 'rxsoft.identity.role.delete',
  },
};
