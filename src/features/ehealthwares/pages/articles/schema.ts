import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildContentPayload } from '../helpers';

const endpoint = '/ehealthwares/admin/articles';

const columns: Column[] = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'slug', label: 'Slug' },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'publishedAt', label: 'Published At', sortable: true },
  { key: 'isActive', label: 'Active', sortable: true },
];

const createFields: Field[] = [
  { name: 'title', label: 'Title', required: true, col: 6 },
  {
    name: 'slug',
    label: 'Slug',
    required: true,
    col: 6,
    placeholder: 'e.g. future-of-pharmacy-2026',
  },
  { name: 'category', label: 'Category', col: 6 },
  { name: 'imageUrl', label: 'Image URL', col: 12, type: 'image', imageSize: 'medium' },
  { name: 'excerpt', label: 'Excerpt', type: 'textarea', col: 12 },
  { name: 'body', label: 'Body (HTML)', type: 'textarea', col: 12 },
  { name: 'publishedAt', label: 'Published At', type: 'date', col: 3 },
  { name: 'isActive', label: 'Active', type: 'switch', col: 3, defaultValue: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

function buildUpdatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

export const ehealthwaresArticlesConfig: ModelConfig = {
  id: 'ehealthwares-articles',
  title: 'eHealthwares Articles',
  description: 'Manage blog articles for the eHealthwares website.',
  endpoint,
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
