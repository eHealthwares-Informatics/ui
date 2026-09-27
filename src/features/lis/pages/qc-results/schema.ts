import type { Column, FieldGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  {
    key: 'qcLot',
    label: 'QC Lot',
    render: (row: any) => row.qcLot?.controlName ?? row.qcLotId ?? '-',
  },
  {
    key: 'testDefinition',
    label: 'Test',
    render: (row: any) => row.testDefinition?.name ?? row.testDefinitionId ?? '-',
  },
  { key: 'value', label: 'Value' },
  { key: 'inControl', label: 'In Control', render: (row: any) => (row.inControl ? 'Yes' : 'No') },
  { key: 'measuredAt', label: 'Measured At' },
  { key: 'instrument', label: 'Instrument' },
  { key: 'technician', label: 'Technician' },
];

const createFieldGroups: FieldGroup[] = [
  {
    title: 'QC Result',
    fields: [
      {
        name: 'qcLotId',
        label: 'QC Lot',
        type: 'async-select',
        searchParam: { endpoint: '/lis/qc-lots', valueKey: 'id', labelKey: 'controlName' },
        required: true,
        col: 6,
      },
      {
        name: 'testDefinitionId',
        label: 'Test',
        type: 'async-select',
        searchParam: { endpoint: '/lis/test-definitions', valueKey: 'id', labelKey: 'name' },
        required: true,
        col: 6,
      },
      { name: 'value', label: 'Value', type: 'number', required: true, col: 4 },
      { name: 'measuredAt', label: 'Measured At', type: 'date', col: 4 },
      { name: 'instrument', label: 'Instrument', type: 'text', col: 4 },
      { name: 'technician', label: 'Technician', type: 'text', col: 6 },
      { name: 'notes', label: 'Notes', type: 'text', col: 12 },
    ],
  },
];

export const qcResultsConfig: ModelConfig = {
  id: 'qc-results',
  title: 'QC Results',
  description: 'Quality control result entry with automatic Westgard rule evaluation.',
  endpoint: '/lis/qc-results',
  columns,
  createFieldGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};
