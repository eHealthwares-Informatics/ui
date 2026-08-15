import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildContentPayload } from '../helpers';

const endpoint = '/ehealthwares/admin/hero-slides';

const columns: Column[] = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'mediaType', label: 'Media', sortable: true },
  { key: 'ctaText', label: 'CTA Text' },
  { key: 'displayOrder', label: 'Order', sortable: true },
  { key: 'isActive', label: 'Active', sortable: true },
];

const createFields: Field[] = [
  { name: 'title', label: 'Title', required: true, col: 12 },
  { name: 'subtitle', label: 'Subtitle', type: 'textarea', col: 12 },
  {
    name: 'mediaType',
    label: 'Media Type',
    type: 'select',
    col: 3,
    options: [
      { value: 'image', label: 'Image' },
      { value: 'video', label: 'Video' },
    ],
  },
  { name: 'mediaUrl', label: 'Media URL', col: 9, placeholder: 'Image or video URL' },
  { name: 'ctaText', label: 'CTA Text', col: 6 },
  { name: 'ctaLink', label: 'CTA Link', col: 6 },
  { name: 'displayOrder', label: 'Display Order', type: 'number', col: 3 },
  { name: 'isActive', label: 'Active', type: 'switch', col: 3, defaultValue: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

function buildUpdatePayload(values: Record<string, unknown>) {
  console.log({values})
  return buildContentPayload(values, createFields);
}

export const ehealthwaresHeroSlidesConfig: ModelConfig = {
  id: 'ehealthwares-hero-slides',
  title: 'eHealthwares Hero Slides',
  description: 'Manage the homepage hero carousel for the eHealthwares website.',
  endpoint,
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
