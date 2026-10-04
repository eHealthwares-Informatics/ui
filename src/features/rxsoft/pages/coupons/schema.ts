import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const columns: Column[] = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'type', label: 'Type' },
  { key: 'value', label: 'Value' },
  { key: 'minSubtotal', label: 'Min Subtotal' },
  { key: 'maxRedemptions', label: 'Max Uses' },
  { key: 'redemptionCount', label: 'Used' },
  { key: 'isActive', label: 'Active', sortable: true },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true, col: 6, placeholder: 'e.g. WELCOME20' },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    col: 6,
    defaultValue: 'percent',
    options: [
      { value: 'percent', label: 'Percent' },
      { value: 'fixed', label: 'Fixed amount' },
    ],
  },
  { name: 'value', label: 'Value (percent / ₦)', type: 'number', col: 6, required: true },
  { name: 'minSubtotal', label: 'Min Subtotal (₦)', type: 'number', col: 6 },
  { name: 'maxRedemptions', label: 'Max Redemptions', type: 'number', col: 6 },
  { name: 'expiresAt', label: 'Expires At', type: 'date', col: 6 },
  { name: 'isActive', label: 'Active', type: 'switch', col: 12, defaultValue: true },
];

function toNumber(value: unknown): number | undefined {
  return value === '' || value === null || value === undefined ? undefined : Number(value);
}

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    type: values.type || 'percent',
    value: toNumber(values.value),
    minSubtotal: toNumber(values.minSubtotal),
    maxRedemptions: toNumber(values.maxRedemptions),
    expiresAt: values.expiresAt || undefined,
    isActive: values.isActive ?? true,
  };
}

function buildUpdatePayload(values: Record<string, unknown>) {
  const payload: Record<string, unknown> = buildCreatePayload(values);
  // Never send an empty code on edit (would rename to '').
  if (!values.code) delete payload.code;
  return payload;
}

export const couponsConfig: ModelConfig = {
  id: 'coupons',
  title: 'Coupons',
  description: 'Discount codes validated at storefront checkout.',
  endpoint: '/coupons',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
