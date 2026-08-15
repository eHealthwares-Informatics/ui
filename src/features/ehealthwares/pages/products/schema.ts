import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildContentPayload, joinArrayLines, splitLinesArray } from '../helpers';

const endpoint = '/ehealthwares/admin/products';

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'slug', label: 'Slug', sortable: true },
  { key: 'tagline', label: 'Tagline' },
  { key: 'iconName', label: 'Icon' },
  { key: 'displayOrder', label: 'Order', sortable: true },
  { key: 'isActive', label: 'Active', sortable: true },
];

const createFields: Field[] = [
  { name: 'name', label: 'Name', required: true, col: 6 },
  { name: 'slug', label: 'Slug', required: true, col: 6, placeholder: 'e.g. rxsoft-pharmacy' },
  { name: 'tagline', label: 'Tagline', col: 12 },
  { name: 'iconName', label: 'Icon Name', col: 6, placeholder: 'e.g. Pill' },
  { name: 'imageUrl', label: 'Image URL', col: 12, type: 'image', imageSize: 'medium' },
  { name: 'description', label: 'Description (HTML)', type: 'textarea', col: 12 },
  {
    name: 'features',
    label: 'Features (one per line)',
    type: 'textarea',
    col: 12,
    placeholder: 'Prescription processing and validation\nMedication dispensing workflows',
  },
  { name: 'displayOrder', label: 'Display Order', type: 'number', col: 3 },
  { name: 'isActive', label: 'Active', type: 'switch', col: 3, defaultValue: true },
  { name: 'metaTitle', label: 'Meta Title', col: 12 },
  { name: 'metaDescription', label: 'Meta Description', type: 'textarea', col: 12 },
];

function buildFormState(row: Record<string, unknown>) {
  return { ...row, features: joinArrayLines(row.features) };
}

function buildCreatePayload(values: Record<string, unknown>) {
  return buildContentPayload(
    { ...values, features: splitLinesArray(values.features) },
    createFields
  );
}

function buildUpdatePayload(values: Record<string, unknown>) {
  return buildContentPayload(
    { ...values, features: splitLinesArray(values.features) },
    createFields
  );
}

export const ehealthwaresProductsConfig: ModelConfig = {
  id: 'ehealthwares-products',
  title: 'eHealthwares Products',
  description: 'Manage marketing products for the eHealthwares website.',
  endpoint,
  columns,
  createFields,
  buildFormState,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
