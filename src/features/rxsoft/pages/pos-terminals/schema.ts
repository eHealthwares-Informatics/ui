import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const terminalProviderOptions = [
  { value: 'paystack', label: 'Paystack' },
  { value: 'monnify', label: 'Monnify' },
  { value: 'opay', label: 'OPay' },
  { value: 'moniepoint', label: 'Moniepoint' },
];

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'label', label: 'Label' },
  { key: 'providerType', label: 'Provider' },
  { key: 'serial', label: 'Serial (SN)' },
  { key: 'terminalId', label: 'Terminal ID' },
  { key: 'isActive', label: 'Active' },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true, col: 6 },
  { name: 'label', label: 'Label', col: 6 },
  {
    name: 'providerType',
    label: 'Provider Type',
    required: true,
    type: 'select',
    options: terminalProviderOptions,
    col: 6,
  },
  { name: 'serial', label: 'Serial (SN)', col: 6 },
  { name: 'terminalId', label: 'Terminal ID', col: 6 },
  { name: 'storeId', label: 'Store ID', col: 6 },
  { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true, col: 6 },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    label: (values.label as string) || undefined,
    providerType: (values.providerType as any)?.value ?? values.providerType,
    serial: (values.serial as string) || undefined,
    terminalId: (values.terminalId as string) || undefined,
    storeId: (values.storeId as string) || undefined,
    isActive: values.isActive,
  };
}

export const posTerminalsConfig: ModelConfig = {
  id: 'pos-terminals',
  title: 'POS Terminals',
  description: 'Physical POS terminals assigned to this organisation (OPay, Moniepoint, Paystack).',
  endpoint: '/pos-terminals',
  columns,
  createFields,
  buildCreatePayload,
  canDelete: true,
};