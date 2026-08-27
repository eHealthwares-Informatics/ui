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

export const paymentProvidersConfig: ModelConfig = {
  id: 'payment-providers',
  title: 'Payment Providers',
  description: 'Gateway providers (Paystack, Monnify, OPay, Moniepoint) with test & live credentials stored in the database.',
  endpoint: '/payment-providers',
  columns,
  createFields,
  buildCreatePayload,
  canDelete: true,
};