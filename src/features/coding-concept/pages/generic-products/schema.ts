import type { ModelConfig } from '@/features/shared/model-schema';
import { ColumnDataType, ColumnTypeFilters, type Column, type Field } from '@/features/rxsoft/types';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'therapeuticClass', label: 'Therapeutic Class' },
  { key: 'pharmaceuticalClass', label: 'Pharma Class' },
  { key: 'dosageForm', label: 'Dosage Form' },
  { key: 'strength', label: 'Strength' },
  { key: 'emdexCode', label: 'EMDEx Code' },
  { key: 'atcCode', label: 'ATC Code' },
  { key: 'ndfGenericCode', label: 'NDF Generic Code' },
  { key: 'isPrescriptionRequired', label: 'Rx Required', render: (r: any) => r.isPrescriptionRequired ? 'Yes' : 'No' },
  { key: 'isControlledSubstance', label: 'Controlled', render: (r: any) => r.isControlledSubstance ? 'Yes' : 'No' },
  { key: 'updatedAt', label: 'Updated', dataType: ColumnDataType.DATE, filters: ColumnTypeFilters.DATE },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true, col: 4 },
  { name: 'name', label: 'Name', required: true, col: 8 },
  { name: 'therapeuticClass', label: 'Therapeutic Class', col: 6 },
  { name: 'pharmaceuticalClass', label: 'Pharmaceutical Class', col: 6 },
  { name: 'dosageForm', label: 'Dosage Form', col: 6 },
  { name: 'strength', label: 'Strength', col: 6 },
  { name: 'emdexCode', label: 'EMDEx Code', col: 6 },
  { name: 'atcCode', label: 'ATC Code', col: 6 },
  { name: 'ndfGenericCode', label: 'NDF Generic Code', col: 6 },
  { name: 'isPrescriptionRequired', label: 'Prescription Required', type: 'switch', col: 6 },
  { name: 'isControlledSubstance', label: 'Controlled Substance', type: 'switch', col: 6 },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
    therapeuticClass: values.therapeuticClass || undefined,
    pharmaceuticalClass: values.pharmaceuticalClass || undefined,
    dosageForm: values.dosageForm || undefined,
    strength: values.strength || undefined,
    emdexCode: values.emdexCode || undefined,
    atcCode: values.atcCode || undefined,
    ndfGenericCode: values.ndfGenericCode || undefined,
    isPrescriptionRequired: values.isPrescriptionRequired ?? false,
    isControlledSubstance: values.isControlledSubstance ?? false,
  };
}

function buildUpdatePayload(values: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (k === 'code' || k === 'name' || k === 'therapeuticClass' || k === 'pharmaceuticalClass'
      || k === 'dosageForm' || k === 'strength' || k === 'emdexCode'
      || k === 'atcCode' || k === 'ndfGenericCode') {
      payload[k] = v ?? undefined;
    }
    if (k === 'isPrescriptionRequired' || k === 'isControlledSubstance') {
      payload[k] = v;
    }
  }
  return payload;
}

export const genericProductsConfig: ModelConfig = {
  id: 'generic-products',
  title: 'Generic Products',
  description: 'Manage generic product reference records.',
  endpoint: '/generic-products',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};