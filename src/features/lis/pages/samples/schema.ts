import type { Column, FieldGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'barcode', label: 'Barcode' },
  {
    key: 'sampleType',
    label: 'Type',
    render: (row: any) => row.sampleType?.name ?? row.sampleTypeId ?? '-',
  },
  { key: 'status', label: 'Status', render: (row: any) => row.status?.name ?? row.statusId ?? '-' },
  { key: 'collector', label: 'Collector' },
  { key: 'collectionDate', label: 'Collected' },
  { key: 'receivedDate', label: 'Received' },
];

const createFieldGroups: FieldGroup[] = [
  {
    title: 'Sample Details',
    fields: [
      {
        name: 'orderId',
        label: 'Order',
        type: 'async-select',
        searchParam: { endpoint: '/lis/orders', valueKey: 'id', labelKey: 'orderNumber' },
        required: true,
        col: 6,
      },
      { name: 'barcode', label: 'Barcode', type: 'text', required: true, col: 6 },
      {
        name: 'sampleTypeId',
        label: 'Sample Type',
        type: 'async-select',
        searchParam: { endpoint: '/lis/sample-types', valueKey: 'id', labelKey: 'name' },
        col: 6,
      },
      { name: 'collector', label: 'Collector', type: 'text', col: 6 },
      { name: 'collectionDate', label: 'Collection Date', type: 'date', col: 4 },
      { name: 'collectionMethod', label: 'Collection Method', type: 'text', col: 4 },
      { name: 'collectionConditions', label: 'Collection Conditions', type: 'text', col: 4 },
      { name: 'quantity', label: 'Quantity', type: 'number', col: 3 },
      { name: 'notes', label: 'Notes', type: 'text', col: 12 },
    ],
  },
];

export const samplesConfig: ModelConfig = {
  id: 'samples',
  title: 'Samples',
  description: 'Physical specimen tracking with barcodes, collection and status management.',
  endpoint: '/lis/samples',
  columns,
  createFieldGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
};
