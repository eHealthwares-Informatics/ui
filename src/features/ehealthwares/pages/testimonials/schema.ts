import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildContentPayload } from '../helpers';

const endpoint = '/ehealthwares/admin/testimonials';

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role' },
  { key: 'company', label: 'Company', sortable: true },
  { key: 'displayOrder', label: 'Order', sortable: true },
  { key: 'isActive', label: 'Active', sortable: true },
];

const createFields: Field[] = [
  { name: 'name', label: 'Name', required: true, col: 6 },
  { name: 'role', label: 'Role', col: 6 },
  { name: 'company', label: 'Company', col: 12 },
  { name: 'avatarUrl', label: 'Avatar URL', col: 12, type: 'image', imageSize: 'small' },
  { name: 'text', label: 'Testimonial', type: 'textarea', col: 12, required: true },
  { name: 'displayOrder', label: 'Display Order', type: 'number', col: 3 },
  { name: 'isActive', label: 'Active', type: 'switch', col: 3, defaultValue: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

function buildUpdatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

export const ehealthwaresTestimonialsConfig: ModelConfig = {
  id: 'ehealthwares-testimonials',
  title: 'eHealthwares Testimonials',
  description: 'Manage customer testimonials for the eHealthwares website.',
  endpoint,
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
