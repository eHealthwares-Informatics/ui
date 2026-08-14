import type { Column, FieldGroup, TabGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'component', label: 'Component' },
  { key: 'property', label: 'Property' },
  { key: 'scale', label: 'Scale' },
];

const tabGroups: TabGroup[] = [
  {
    title: 'LOINC Details',
    value: 'loincDetails',
    fieldGroups: [
      {
        title: 'Core Information',
        fields: [
          { name: 'code', label: 'Code', type: 'text', required: true, col: 4, generateCode: { scope: 'loinc', seedField: 'component' } },
          { name: 'component', label: 'Component', type: 'text', col: 8 },
          { name: 'property', label: 'Property', type: 'text', col: 4 },
          { name: 'system', label: 'System', type: 'text', col: 4 },
          { name: 'scale', label: 'Scale', type: 'text', col: 4 },
        ],
      },
    ],
  },
];

export const loincConfig: ModelConfig = {
  id: 'loinc',
  title: 'LOINC',
  description: 'Seeded and local LOINC test codes.',
  endpoint: '/lis/loinc',
  columns,
  tabGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};
