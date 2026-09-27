import type { Column, FieldGroup, TabGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'orderItemId', label: 'Order Item' },
  { key: 'value', label: 'Value' },
  { key: 'unitId', label: 'Unit', render: (row: any) => row.unit?.name ?? row.unitId },
  { key: 'enteredDate', label: 'Entered' },
  { key: 'validatedDate', label: 'Validated' },
  { key: 'acknowledgedAt', label: 'Acknowledged' },
];

const tabGroups: TabGroup[] = [
  {
    title: 'Result',
    value: 'result',
    fieldGroups: [
      {
        title: 'Result Entry',
        fields: [
          { name: 'orderItemId', label: 'Order Item ID', type: 'text', disabled: true, col: 4 },
          { name: 'value', label: 'Value', type: 'text', required: true, col: 4 },
          {
            name: 'unitId',
            label: 'Unit',
            type: 'async-select',
            searchParam: { endpoint: '/lis/uoms', valueKey: 'id', labelKey: 'name' },
            col: 4,
          },
          { name: 'abnormal', label: 'Abnormal', type: 'switch', col: 3 },
          { name: 'notes', label: 'Notes', type: 'text', col: 12 },
          {
            name: 'enteredById',
            label: 'Entered By',
            type: 'async-select',
            searchParam: { endpoint: '/lis/users', valueKey: 'id', labelKey: 'name' },
            col: 4,
          },
          { name: 'enteredDate', label: 'Entered Date', type: 'text', col: 4 },
          {
            name: 'validatedById',
            label: 'Validated By',
            type: 'async-select',
            searchParam: { endpoint: '/lis/users', valueKey: 'id', labelKey: 'name' },
            col: 4,
          },
          { name: 'validatedDate', label: 'Validated Date', type: 'text', col: 4 },
        ],
      },
    ],
  },
];

export const resultsConfig: ModelConfig = {
  id: 'results',
  title: 'Results',
  description: 'Test result values entered against order items.',
  endpoint: '/lis/results',
  columns,
  tabGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};
