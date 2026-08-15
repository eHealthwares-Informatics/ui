import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildContentPayload } from '../helpers';

const endpoint = '/ehealthwares/admin/partners';

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'websiteUrl', label: 'Website' },
  { key: 'displayOrder', label: 'Order', sortable: true },
];

const createFields: Field[] = [
  { name: 'name', label: 'Name', required: true, col: 6 },
  { name: 'logoUrl', label: 'Logo URL', col: 12, type: 'image', imageSize: 'small' },
  { name: 'websiteUrl', label: 'Website URL', col: 12 },
  { name: 'displayOrder', label: 'Display Order', type: 'number', col: 3 },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

function buildUpdatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

export const ehealthwaresPartnersConfig: ModelConfig = {
  id: 'ehealthwares-partners',
  title: 'eHealthwares Partners',
  description: 'Manage partner logos for the eHealthwares website.',
  endpoint,
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
