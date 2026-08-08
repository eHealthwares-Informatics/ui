import type { Column, FieldGroup, TabGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildPayload } from '@/features/shared/payload-utils';

const columns: Column[] = [
  { key: 'alias', label: 'Alias' },
  { key: 'testId', label: 'Test', render: (row: any) => row.test?.name ?? row.testId },
  { key: 'gender', label: 'Gender' },
  { key: 'minAge', label: 'Min Age' },
  { key: 'maxAge', label: 'Max Age' },
  { key: 'lowValue', label: 'Low Value' },
  { key: 'highValue', label: 'High Value' },
  { key: 'active', label: 'Active' },
];

const allFields: FieldGroup['fields'] = [
  { name: 'alias', label: 'Alias', type: 'text', required: true, col: 6 },
  { name: 'testId', label: 'Test Definition', type: 'async-select', searchParam: { endpoint: '/lis/test-definitions', valueKey: 'id', labelKey: 'name' }, required: true, col: 6 },
  { name: 'gender', label: 'Gender', type: 'select', options: ['MALE', 'FEMALE', 'DEFAULT'], col: 3 },
  { name: 'active', label: 'Active', type: 'switch', col: 3 },
  { name: 'minAge', label: 'Min Age (days)', type: 'number', col: 3 },
  { name: 'maxAge', label: 'Max Age (days)', type: 'number', col: 3 },
  { name: 'lowValue', label: 'Low Value', type: 'number', col: 3 },
  { name: 'highValue', label: 'High Value', type: 'number', col: 3 },
  { name: 'riticaLow', label: 'Low Critical', type: 'number', col: 3 },
  { name: 'criticalHigh', label: 'High Critical', type: 'number', col: 3 },
  { name: 'unitId', label: 'Unit', type: 'async-select', searchParam: { endpoint: '/lis/uoms', valueKey: 'id', labelKey: 'name' }, col: 4 },
];

const tabGroups: TabGroup[] = [
  {
    title: 'Reference Range',
    value: 'ref-range',
    fieldGroups: [{ title: 'Range Details', fields: allFields }],
  },
];

function buildFormState(row: Record<string, unknown>) {
  const state = { ...row };
  for (const key in row) {
    if (key.endsWith('Id')) {
      const relName = key.replace('Id', '');
      const rel = row[relName] as Record<string, unknown> | undefined;
      if (rel?.id && rel?.name) {
        state[key] = { value: rel.id, label: rel.name };
      }
      delete state[relName];
    }
  }
  return state;
}

export const referenceRangesConfig: ModelConfig = {
  id: 'reference-ranges',
  title: 'Reference Ranges',
  description: 'Age- and gender-specific normal/critical ranges per test definition.',
  endpoint: '/lis/reference-ranges',
  columns,
  tabGroups,
  buildCreatePayload: (v) => buildPayload(v, allFields),
  buildUpdatePayload: (v) => buildPayload(v, allFields),
  buildFormState
};