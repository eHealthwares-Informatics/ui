import { ActionIcon } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { Settings } from 'lucide-react';
import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'isActive', label: 'Active' },
  { key: 'updatedAt', label: 'Updated' },
  {
    key: 'settings',
    label: '',
    render: (row) => (
      <ActionIcon variant="light" component={Link} to={`/admin/organizations/${row.id}/settings`}>
        <Settings size={16} />
      </ActionIcon>
    ),
  },
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

// Enables the row-level edit action (ui#785). PUT/PATCH /organizations/:id
// already exist; without this the edit modal was unreachable.
function buildUpdatePayload(values: Record<string, unknown>) {
  return {
    code: (values.code as string) || undefined,
    name: (values.name as string) || undefined,
    isActive: values.isActive,
  };
}

export const organizationsConfig: ModelConfig = {
  id: 'organizations',
  title: 'Organizations',
  description: 'Tenant-level organization records and activation status.',
  endpoint: '/organizations',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
