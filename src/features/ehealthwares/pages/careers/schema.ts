import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildContentPayload } from '../helpers';

const endpoint = '/ehealthwares/admin/careers';

const columns: Column[] = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'location', label: 'Location', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'isActive', label: 'Active', sortable: true },
];

const createFields: Field[] = [
  { name: 'title', label: 'Title', required: true, col: 6 },
  {
    name: 'slug',
    label: 'Slug',
    required: true,
    col: 6,
    placeholder: 'e.g. senior-software-engineer',
  },
  { name: 'location', label: 'Location', col: 6 },
  { name: 'department', label: 'Department', col: 6 },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    col: 6,
    options: [
      { value: 'full-time', label: 'Full-time' },
      { value: 'contract', label: 'Contract' },
      { value: 'remote', label: 'Remote' },
    ],
  },
  { name: 'imageUrl', label: 'Image URL', col: 12, type: 'image', imageSize: 'medium' },
  { name: 'description', label: 'Description', type: 'textarea', col: 12 },
  { name: 'isActive', label: 'Active', type: 'switch', col: 3, defaultValue: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

function buildUpdatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

export const ehealthwaresCareersConfig: ModelConfig = {
  id: 'ehealthwares-careers',
  title: 'eHealthwares Careers',
  description: 'Manage career openings for the eHealthwares website.',
  endpoint,
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
