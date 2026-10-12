import {
  ColumnDataType,
  ColumnTypeFilters,
  type Column,
  type Field,
  type Option,
} from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'therapeuticClass', label: 'Therapeutic Class' },
  { key: 'pharmaceuticalClass', label: 'Pharma Class' },
  { key: 'dosageForm', label: 'Dosage Form' },
  { key: 'strength', label: 'Strength' },
  { key: 'uomCode', label: 'Base UOM Code' },
  { key: 'emdexCode', label: 'EMDEx Code' },
  { key: 'atcCode', label: 'ATC Code' },
  { key: 'ndfGenericCode', label: 'NDF Generic Code' },
  {
    key: 'isPrescriptionRequired',
    label: 'Rx Required',
    render: (r: any) => (r.isPrescriptionRequired ? 'Yes' : 'No'),
  },
  {
    key: 'isControlledSubstance',
    label: 'Controlled',
    render: (r: any) => (r.isControlledSubstance ? 'Yes' : 'No'),
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
  },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true, col: 4 },
  { name: 'name', label: 'Name', required: true, col: 8 },
  {
    name: 'classificationIds',
    label: 'Classifications',
    type: 'multi-async-select',
    col: 12,
    searchParam: {
      endpoint: '/drug-classifications',
      queryParam: 'search',
      valueKey: 'id',
      labelKey: 'name',
      minChars: 0,
    },
    toOptions: (values) =>
      (Array.isArray(values) ? values : []).map((value: any) =>
        typeof value === 'string'
          ? { value, label: value }
          : { value: value.id ?? value.value, label: value.name ?? value.label }
      ),
  },
  { name: 'dosageForm', label: 'Dosage Form', col: 6 },
  { name: 'strength', label: 'Strength', col: 6 },
  { name: 'uomCode', label: 'Base UOM Code', col: 6 },
  { name: 'emdexCode', label: 'EMDEx Code', col: 6 },
  { name: 'atcCode', label: 'ATC Code', col: 6 },
  { name: 'ndfGenericCode', label: 'NDF Generic Code', col: 6 },
  { name: 'isPrescriptionRequired', label: 'Prescription Required', type: 'switch', col: 6 },
];

function buildCreatePayload(values: Record<string, unknown>) {
  const classifications = Array.isArray(values.classificationIds)
    ? (values.classificationIds as (string | Option)[])
        .map((value) => (typeof value === 'string' ? value : value.value))
        .filter(Boolean)
    : [];
  return {
    code: values.code,
    name: values.name,
    classificationIds: classifications,
    dosageForm: values.dosageForm || undefined,
    strength: values.strength || undefined,
    uomCode: values.uomCode || undefined,
    emdexCode: values.emdexCode || undefined,
    atcCode: values.atcCode || undefined,
    ndfGenericCode: values.ndfGenericCode || undefined,
    isPrescriptionRequired: values.isPrescriptionRequired ?? false,
  };
}

function buildUpdatePayload(values: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (
      k === 'code' ||
      k === 'name' ||
      k === 'dosageForm' ||
      k === 'strength' ||
      k === 'uomCode' ||
      k === 'emdexCode' ||
      k === 'atcCode' ||
      k === 'ndfGenericCode'
    ) {
      payload[k] = v ?? undefined;
    }
    if (k === 'classificationIds') {
      payload[k] = Array.isArray(v)
        ? (v as (string | Option)[])
            .map((value) => (typeof value === 'string' ? value : value.value))
            .filter(Boolean)
        : [];
    }
    if (k === 'isPrescriptionRequired') {
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
  buildFormState: (row) => ({
    ...row,
    classificationIds: (Array.isArray(row.classifications) ? row.classifications : []).map(
      (classification: any) => ({ value: classification.id, label: classification.name })
    ),
  }),
  canDelete: true,
};
