import type { Column, FieldGroup, Option, TabGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'active', label: 'Active' },
];

const tabGroups: TabGroup[] = [
  {
    title: 'Panel Info',
    value: 'panel',
    fieldGroups: [
      {
        title: 'Panel Details',
        fields: [
          { name: 'code', label: 'Code', type: 'text', required: true, col: 4 },
          { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
          { name: 'description', label: 'Description', type: 'text', col: 12 },
          { name: 'active', label: 'Active', type: 'switch', col: 3 },
          {
            name: 'testIds',
            label: 'Tests',
            type: 'multi-async-select',
            searchParam: { endpoint: '/lis/test-definitions', valueKey: 'id', labelKey: 'name' },
            col: 12,
          },
        ],
      },
    ],
  },
];

export const panelsConfig: ModelConfig = {
  id: 'panels',
  title: 'Panels',
  description: 'Multitest panels (e.g. CBC, LFT) with embedded test references.',
  endpoint: '/lis/panels',
  columns,
  tabGroups,
  buildCreatePayload: toApiPayload,
  buildUpdatePayload: toApiPayload,
  buildFormState,
  canDelete: true,
};

/** Converts the form's testIds (Option[] or id[]) into the backend's items array */
function toApiPayload(v: Record<string, unknown>) {
  const ids = (Array.isArray(v.testIds) ? v.testIds : [])
    .map((item: unknown) =>
      typeof item === 'string'
        ? item
        : ((item as Option)?.value ?? (item as any)?.id ?? (item as any)?.testId ?? '')
    )
    .filter(Boolean);
  const payload: Record<string, unknown> = { ...v };
  payload.items = ids.map((testId, sortOrder) => ({ testId, sortOrder }));
  delete payload.testIds;
  return payload;
}

/** Loads the backend's items array into testIds Options for the form */
function buildFormState(row: Record<string, unknown>) {
  const state: Record<string, unknown> = { ...row };
  state.testIds = (Array.isArray(row.items) ? row.items : []).map((item: any) => ({
    value: item.testId,
    label: item.testName ?? item.test?.name ?? item.testId,
  }));
  delete state.items;
  return state;
}
