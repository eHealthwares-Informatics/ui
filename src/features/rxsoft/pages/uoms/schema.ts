import { FieldGroupSpec } from '@/components/form/types/form-context';
import { Column, ColumnTypeFilters, Option } from '../../types';

export type UomListState = {
  code?: string;
  name?: string;
  category?: Option;
  uomType?: Option;
  factor?: number;
  rounding?: number;
};

export const UOM_COLUMNS: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name', filters: ColumnTypeFilters.STRING },
  { key: 'category.name', label: 'Category', filters: ColumnTypeFilters.STRING },
  { key: 'uomType', label: 'Type' },
  { key: 'factor', label: 'Factor' },
  { key: 'isActive', label: 'Active' },
];

export const UOM_CREATE_FIELDS: FieldGroupSpec = {
  title: 'Create Unit of Measure',
  mutationMode: 'field',
  fields: [
    {
      name: 'code',
      label: 'Code',
      type: 'text',
      placeholder: 'e.g., mg, ml, g',
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'e.g., Milligrams, Milliliters',
      required: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'async-select',
      searchParam: {
        endpoint: '/uom-categories',
        minChars: 2,
        queryParam: 'search',
        labelKey: 'name',
        valueKey: 'id',
      },
    },
    {
      name: 'uomType',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'reference', value: 'reference' },
        { label: 'bigger', value: 'bigger' },
        { label: 'smaller', value: 'smaller' },
      ],
      required: true,
      placeholder: 'reference|bigger|smaller',
    },
    {
      name: 'factor',
      label: 'Factor',
      type: 'number',
    },
    {
      name: 'rounding',
      label: 'Rounding',
      type: 'number',
    },
  ],
};
export const buildFormState = (row: Record<string, any>) => {
  const formState = { ...row };
  for (const key in row) {
    // check for fields like categoryId, baseUomId, etc.
    if (key.endsWith('Id')) {
      const fieldName = key.replace('Id', '');
      const relation = row[fieldName];
      // if related object exists
      if (relation?.id && relation?.name) {
        formState[fieldName] = {
          label: relation.name,
          value: relation.id,
        };
      }
    }
  }

  return formState;
};
import type { ModelConfig } from '@/features/shared/model-schema';

export const uomsConfig: ModelConfig = {
  id: 'uoms',
  title: 'UOMs',
  description: 'Manage units of measure.',
  endpoint: '/uoms',
  columns: UOM_COLUMNS,
  createFields: UOM_CREATE_FIELDS.fields,
  buildCreatePayload: (values) => buildCreatePayload(values as UomListState),
  buildUpdatePayload: (values) => buildCreatePayload(values as UomListState),
  buildFormState,
  canDelete: true,
  detailPathBuilder: (row) => `/uoms/${String(row.id)}`,
};

export function buildCreatePayload(values: UomListState) {
  return {
    code: values.code || undefined,
    name: values.name,
    categoryId: values.category?.value || undefined,
    uomType: values.uomType?.value || undefined,
    factor: values.factor ? Number(values.factor) : undefined,
    rounding: values.rounding ? Number(values.rounding) : undefined,
  };
}
