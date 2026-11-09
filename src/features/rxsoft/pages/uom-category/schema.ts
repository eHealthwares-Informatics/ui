import { FieldGroupSpec } from '@/components/form/types/form-context';
import { Column, ColumnTypeFilters, Option } from '../../types';

export type UomCategoryListState = {
  code?: string;
  name?: string;
  parent?: Option;
  description?: string;
  active?: boolean;
};

export const UOM_COLUMNS: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name', filters: ColumnTypeFilters.STRING },
  { key: 'parent.name', label: 'Parent', filters: ColumnTypeFilters.STRING },
  { key: 'description', label: 'Description' },
  { key: 'isActive', label: 'Active' },
];

export const UOM_CATEGORY_CREATE_FIELDS: FieldGroupSpec = {
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
      name: 'parent',
      label: 'Parent',
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
      name: 'description',
      label: 'Description',
      type: 'text',
    },
    {
      name: 'active',
      label: 'Active',
      type: 'switch',
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

export const uomCategoryConfig: ModelConfig = {
  id: 'uom-category',
  title: 'UOM Categories',
  description: 'Manage units of measure categories.',
  endpoint: '/uoms',
  columns: UOM_COLUMNS,
  createFields: UOM_CATEGORY_CREATE_FIELDS.fields,
  buildCreatePayload: (values) => buildCreatePayload(values as UomCategoryListState),
  buildUpdatePayload: (values) => buildCreatePayload(values as UomCategoryListState),
  buildFormState,
  canDelete: true,
  detailPathBuilder: (row) => `/uom-categories/${String(row.id)}`,
};

export function buildCreatePayload(values: UomCategoryListState) {
  return {
    code: values.code || undefined,
    name: values.name,
    parentId: values.parent?.value || undefined,
    active: values.active,
    description: values.description || undefined,
  };
}
