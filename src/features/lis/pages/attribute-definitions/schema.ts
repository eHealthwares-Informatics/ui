import type { Column, FieldGroup, TabGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'dataType', label: 'Data Type' },
  { key: 'active', label: 'Active' },
];

const tabGroups: TabGroup[] = [
  {
    title: 'Attribute Definition',
    value: 'attribute',
    fieldGroups: [
      {
        title: 'Basic Information',
        fields: [
          { name: 'code', label: 'Code', type: 'text', col: 4, generateCode: { scope: 'attribute-definitions' } },
          { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
          { name: 'dataType', label: 'Data Type', type: 'select', options: [{ value: 'TEXT', label: 'Text' }, { value: 'NUMBER', label: 'Number' }, { value: 'DATE', label: 'Date' }, { value: 'BOOLEAN', label: 'Boolean' }, { value: 'SELECT', label: 'Select' }], col: 4 },
          { name: 'description', label: 'Description', type: 'text', col: 12 },
          { name: 'active', label: 'Active', type: 'switch', col: 3 },
          { name: 'options', label: 'Options (JSON array for SELECT type)', type: 'text', col: 12 },
        ],
      },
    ],
  },
];

export const attributeDefinitionsConfig: ModelConfig = {
  id: 'attribute-definitions',
  title: 'Attribute Definitions',
  description: 'Configurable sample and test attributes.',
  endpoint: '/lis/attribute-definitions',
  columns,
  tabGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};
