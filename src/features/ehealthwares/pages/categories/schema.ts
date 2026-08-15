import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildContentPayload } from '../helpers';

const endpoint = '/ehealthwares/admin/categories';

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'slug', label: 'Slug', sortable: true },
  { key: 'displayOrder', label: 'Order', sortable: true },
  { key: 'isActive', label: 'Active', sortable: true },
];

const createFields: Field[] = [
  { name: 'name', label: 'Name', required: true, col: 6 },
  { name: 'slug', label: 'Slug', required: true, col: 6, placeholder: 'e.g. pharmacy' },
  { name: 'description', label: 'Description', type: 'textarea', col: 12 },
  { name: 'iconUrl', label: 'Icon URL', col: 12 },
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

export const ehealthwaresCategoriesConfig: ModelConfig = {
  id: 'ehealthwares-categories',
  title: 'eHealthwares Categories',
  description: 'Manage product categories for the eHealthwares website.',
  endpoint,
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
