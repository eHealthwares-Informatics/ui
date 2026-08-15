import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildContentPayload } from '../helpers';

const endpoint = '/ehealthwares/admin/settings';

const columns: Column[] = [
  { key: 'key', label: 'Key', sortable: true },
  { key: 'value', label: 'Value' },
];

const createFields: Field[] = [
  { name: 'key', label: 'Key', required: true, col: 6, placeholder: 'e.g. contact_email' },
  { name: 'value', label: 'Value', col: 6 },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

function buildUpdatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

export const ehealthwaresSettingsConfig: ModelConfig = {
  id: 'ehealthwares-settings',
  title: 'eHealthwares Site Settings',
  description: 'Manage site-wide settings for the eHealthwares website.',
  endpoint,
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
