import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const insuranceTypeOptions = [
  { value: 'hmo', label: 'HMO' },
  { value: 'company', label: 'Company' },
  { value: 'program', label: 'Program' },
  { value: 'nhis', label: 'NHIS' },
  { value: 'other', label: 'Other' },
];

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'providerType', label: 'Type' },
  { key: 'contactPhone', label: 'Phone' },
  { key: 'contactEmail', label: 'Email' },
  { key: 'isActive', label: 'Active' },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true, col: 6 },
  { name: 'name', label: 'Name', required: true, col: 6 },
  {
    name: 'providerType',
    label: 'Type',
    required: true,
    type: 'select',
    options: insuranceTypeOptions,
    col: 6,
  },
  { name: 'contactPhone', label: 'Contact Phone', col: 6 },
  { name: 'contactEmail', label: 'Contact Email', col: 6 },
  { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true, col: 6 },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
    providerType: (values.providerType as any)?.value ?? values.providerType,
    contactPhone: (values.contactPhone as string) || undefined,
    contactEmail: (values.contactEmail as string) || undefined,
    isActive: values.isActive,
  };
}

export const insuranceProvidersConfig: ModelConfig = {
  id: 'insurance-providers',
  title: 'Insurance Providers',
  description: 'HMOs, corporate programs, NHIS and other insurers accepted by this organisation.',
  endpoint: '/insurance-providers',
  columns,
  createFields,
  buildCreatePayload,
  canDelete: true,
};