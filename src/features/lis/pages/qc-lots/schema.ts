import type { Column, FieldGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'controlName', label: 'Control Name' },
  { key: 'lotNumber', label: 'Lot Number' },
  { key: 'expiryDate', label: 'Expiry' },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'active', label: 'Active', render: (row: any) => (row.active ? 'Yes' : 'No') },
];

const createFieldGroups: FieldGroup[] = [
  {
    title: 'QC Lot Details',
    fields: [
      { name: 'controlName', label: 'Control Name', type: 'text', required: true, col: 6 },
      { name: 'lotNumber', label: 'Lot Number', type: 'text', required: true, col: 6 },
      { name: 'expiryDate', label: 'Expiry Date', type: 'date', col: 4 },
      { name: 'manufacturer', label: 'Manufacturer', type: 'text', col: 4 },
      { name: 'active', label: 'Active', type: 'switch', col: 4 },
      { name: 'notes', label: 'Notes', type: 'text', col: 12 },
    ],
  },
];

export const qcLotsConfig: ModelConfig = {
  id: 'qc-lots',
  title: 'QC Lots',
  description: 'Quality control lot tracking with target means and standard deviations per test.',
  endpoint: '/lis/qc-lots',
  columns,
  createFieldGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};
