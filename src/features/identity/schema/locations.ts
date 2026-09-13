import type { Column, Field, Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { identityApi } from '@/lib/identity-api';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'parentId', label: 'Parent Location' },
  { key: 'isActive', label: 'Active' },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true },
  { name: 'name', label: 'Name', required: true },
  {
    name: 'parentId',
    label: 'Parent Location',
    type: 'async-select',
    searchParam: {
      endpoint: '/locations',
      queryParam: 'search',
      valueKey: 'id',
      labelKey: 'name',
      minChars: 0,
    },
  },
  { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    code: values.code,
    name: values.name,
    parentId: values.parentId ? ((values.parentId as Option).value ?? values.parentId) : undefined,
    isActive: values.isActive,
  };
}

function buildUpdatePayload(values: Record<string, unknown>, _row?: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  if ('code' in values && values.code) {
    payload.code = values.code;
  }
  if ('name' in values && values.name) {
    payload.name = values.name;
  }
  if ('parentId' in values) {
    payload.parentId = values.parentId
      ? ((values.parentId as Option).value ?? values.parentId)
      : null;
  }
  if ('isActive' in values) {
    payload.isActive = values.isActive;
  }
  return payload;
}

function buildFormState(row: Record<string, unknown>) {
  const formState = { ...row };
  if (typeof formState.parentId === 'string' && formState.parentId) {
    formState.parentId = { value: formState.parentId, label: formState.parentId };
  }
  return formState;
}

export const identityLocationsConfig: ModelConfig = {
  id: 'identity-locations',
  title: 'Locations',
  description: 'Sites and locations scoped to organizations, with optional parent hierarchy.',
  endpoint: '/locations',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  buildFormState,
  canDelete: true,
  apiProvider: identityApi,
};
