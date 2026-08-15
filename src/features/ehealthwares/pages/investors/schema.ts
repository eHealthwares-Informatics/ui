import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildContentPayload } from '../helpers';

const endpoint = '/ehealthwares/admin/investors';

const columns: Column[] = [
  { key: 'label', label: 'Label', sortable: true },
  { key: 'value', label: 'Value', sortable: true },
  { key: 'description', label: 'Description' },
  { key: 'displayOrder', label: 'Order', sortable: true },
  { key: 'isActive', label: 'Active', sortable: true },
];

const createFields: Field[] = [
  { name: 'label', label: 'Label', required: true, col: 6, placeholder: 'e.g. Markets Served' },
  { name: 'value', label: 'Value', required: true, col: 6, placeholder: 'e.g. 12+' },
  { name: 'description', label: 'Description', type: 'textarea', col: 12 },
  { name: 'displayOrder', label: 'Display Order', type: 'number', col: 3 },
  { name: 'isActive', label: 'Active', type: 'switch', col: 3, defaultValue: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

function buildUpdatePayload(values: Record<string, unknown>) {
  return buildContentPayload(values, createFields);
}

export const ehealthwaresInvestorsConfig: ModelConfig = {
  id: 'ehealthwares-investors',
  title: 'eHealthwares Investor Data',
  description: 'Manage investor stats for the eHealthwares website.',
  endpoint,
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
