import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field, Option } from '../../types';

const providerTypeOptions = [
  { value: 'paystack', label: 'Paystack' },
  { value: 'monnify', label: 'Monnify' },
  { value: 'opay', label: 'OPay' },
  { value: 'moniepoint', label: 'Moniepoint' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'cash', label: 'Cash' },
];

const channelOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'pos', label: 'POS' },
  { value: 'web', label: 'Web' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'insurance', label: 'Insurance' },
];

const columns: Column[] = [
  { key: 'paymentProvider.code', label: 'Provider Code' },
  { key: 'paymentProvider.name', label: 'Provider Name' },
  { key: 'paymentProvider.providerType', label: 'Provider Type' },
  { key: 'paymentProvider.channel', label: 'Channel' },
  { key: 'isActive', label: 'Active', render: (row: any) => row.isActive ? 'Yes' : 'No' },
  { key: 'isDefault', label: 'Default', render: (row: any) => row.isDefault ? 'Yes' : 'No' },
];

const createFields: Field[] = [
  {
    name: 'paymentProviderId',
    label: 'Provider',
    type: 'async-select',
    searchParam: {
      endpoint: '/payment-providers',
      minChars: 0,
      valueKey: 'id',
      labelKey: 'name',
    },
    required: true,
    col: 6,
  },
  { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true, col: 6 },
  { name: 'isDefault', label: 'Default', type: 'switch', defaultValue: false, col: 6 },
];

function coerceJson(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'object') return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value));
  } catch {
    return undefined;
  }
}

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    organizationId: values.organizationId,
    paymentProviderId: (values.paymentProviderId as Option).value,
    isActive: values.isActive,
    isDefault: values.isDefault,
  };
}

function buildUpdatePayload(values: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (values.isActive !== undefined) { payload.isActive = values.isActive; }
  if (values.isDefault !== undefined) { payload.isDefault = values.isDefault; }
  return payload;
}

function stringifyJson(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildFormState(row: Record<string, unknown>): Record<string, unknown> {
  return {
    isActive: row.isActive,
    isDefault: row.isDefault,
    paymentProviderId: row.paymentProviderId,
  };
}

export const organisationPaymentProvidersConfig: ModelConfig = {
  id: 'organisation-payment-providers',
  title: 'Organisation Payment Providers',
  description: 'Gateway providers whitelisted/blacklisted per organisation',
  endpoint: '/organisation-payment-providers',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  buildFormState,
  canDelete: true,
};