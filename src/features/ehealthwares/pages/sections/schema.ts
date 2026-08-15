import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildContentPayload } from '../helpers';

const endpoint = '/ehealthwares/admin/sections';

const columns: Column[] = [
  { key: 'key', label: 'Key', sortable: true },
  { key: 'title', label: 'Title' },
  { key: 'displayOrder', label: 'Order', sortable: true },
  { key: 'isActive', label: 'Active', sortable: true },
];

const createFields: Field[] = [
  { name: 'key', label: 'Key', required: true, col: 6, placeholder: 'e.g. about' },
  { name: 'title', label: 'Title', col: 12 },
  { name: 'subtitle', label: 'Subtitle', type: 'textarea', col: 12 },
  { name: 'content', label: 'Content (HTML)', type: 'textarea', col: 12 },
  { name: 'imageUrl', label: 'Image URL', col: 12, type: 'image', imageSize: 'medium' },
  { name: 'displayOrder', label: 'Display Order', type: 'number', col: 3 },
  { name: 'isActive', label: 'Active', type: 'switch', col: 3, defaultValue: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

function buildUpdatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

export const ehealthwaresSectionsConfig: ModelConfig = {
  id: 'ehealthwares-sections',
  title: 'eHealthwares Site Sections',
  description: 'Manage homepage sections for the eHealthwares website.',
  endpoint,
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
