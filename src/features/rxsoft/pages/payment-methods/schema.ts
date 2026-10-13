import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const methodTypeOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'insurance', label: 'Insurance' },
];

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'methodType', label: 'Type' },
  { key: 'isActive', label: 'Active' },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true },
  { name: 'name', label: 'Name', required: true },
  {
    name: 'methodType',
    label: 'Method Type',
    required: true,
    type: 'select',
    options: methodTypeOptions,
  },
  { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
    methodType: (values.methodType as any).value,
    isActive: values.isActive,
  };
}

// Enables the row-level edit action (ui#785). PUT/PATCH /payment-methods/:id
// already exist; without this the edit modal was unreachable.
function buildUpdatePayload(values: Record<string, unknown>) {
  return {
    code: (values.code as string) || undefined,
    name: (values.name as string) || undefined,
    methodType: (values.methodType as any)?.value ?? values.methodType,
    isActive: values.isActive,
  };
}

export const paymentMethodsConfig: ModelConfig = {
  id: 'payment-methods',
  title: 'Payment Methods',
  description: 'Accepted payment instruments and their active status.',
  endpoint: '/payment-methods',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
