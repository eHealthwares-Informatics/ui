import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

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
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'providerType', label: 'Provider' },
  { key: 'channel', label: 'Channel' },
  {
    key: 'production',
    label: 'Mode',
    render: (row: any) => (row.production ? 'Live' : 'Test'),
  },
  { key: 'isActive', label: 'Active' },
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

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true, col: 6 },
  { name: 'name', label: 'Name', required: true, col: 6 },
  {
    name: 'providerType',
    label: 'Provider Type',
    required: true,
    type: 'select',
    options: providerTypeOptions,
    col: 6,
  },
  { name: 'channel', label: 'Channel', required: true, type: 'select', options: channelOptions, col: 6 },
  { name: 'description', label: 'Description', col: 12 },
  { name: 'production', label: 'Use Live credentials', type: 'switch', defaultValue: false, col: 6 },
  { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true, col: 6 },
  { name: 'testConfig', label: 'Test Credentials (JSON)', type: 'json', col: 12 },
  { name: 'liveConfig', label: 'Live Credentials (JSON)', type: 'json', col: 12 },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
    providerType: (values.providerType as any)?.value ?? values.providerType,
    channel: (values.channel as any)?.value ?? values.channel,
    description: (values.description as string) || undefined,
    production: values.production,
    testConfig: coerceJson(values.testConfig),
    liveConfig: coerceJson(values.liveConfig),
    isActive: values.isActive,
  };
}

function buildUpdatePayload(values: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (values.name !== undefined) { payload.name = values.name; }
  if (values.code !== undefined) { payload.code = values.code; }
  if (values.providerType !== undefined) {
    payload.providerType = (values.providerType as any)?.value ?? values.providerType;
  }
  if (values.channel !== undefined) {
    payload.channel = (values.channel as any)?.value ?? values.channel;
  }
  if (values.description !== undefined) {
    payload.description = (values.description as string) || undefined;
  }
  if (values.production !== undefined) { payload.production = values.production; }
  if (values.isActive !== undefined) { payload.isActive = values.isActive; }
  if (values.testConfig !== undefined) {
    const cfg = coerceJson(values.testConfig);
    if (cfg) { payload.testConfig = cfg; }
  }
  if (values.liveConfig !== undefined) {
    const cfg = coerceJson(values.liveConfig);
    if (cfg) { payload.liveConfig = cfg; }
  }
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
    ...row,
    production: row.production,
    isActive: row.isActive,
    testConfig: stringifyJson(row.testConfig),
    liveConfig: stringifyJson(row.liveConfig),
  };
}

export const paymentProvidersConfig: ModelConfig = {
  id: 'payment-providers',
  title: 'Payment Providers',
  description: 'Gateway providers (Paystack, Monnify, OPay, Moniepoint) with test & live credentials stored in the database.',
  endpoint: '/payment-providers',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  buildFormState,
  canDelete: true,
};