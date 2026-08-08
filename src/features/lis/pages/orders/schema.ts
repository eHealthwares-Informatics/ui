import type { Column, FieldGroup, TabGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'orderNumber', label: 'Order #' },
  { key: 'patientName', label: 'Patient' },
  { key: 'patientId', label: 'MRN' },
  { key: 'status', label: 'Status' },
  { key: 'requestedDate', label: 'Requested' },
];

const tabGroups: TabGroup[] = [
  {
    title: 'Order',
    value: 'order',
    fieldGroups: [
      {
        title: 'Patient Information',
        fields: [
          { name: 'patientId', label: 'MRN', type: 'text', required: true, col: 4 },
          { name: 'patientName', label: 'Patient Name', type: 'text', required: true, col: 8 },
          { name: 'patientGender', label: 'Gender', type: 'select', options: [{value: 'MALE', label: 'MALE'}, {value: 'FEMALE', label:'FEMALE'}, {value: 'OTHER', label: 'OTHER'}, {value:'UNKNOWN', label: 'UNKNOWN'}], col: 3 },
          { name: 'patientDateOfBirth', label: 'Date of Birth', type: 'text', col: 3 },
          { name: 'patientAge', label: 'Age', type: 'number', col: 3 },
          { name: 'internalReference', label: 'Internal Reference', type: 'text', col: 3 },
          { name: 'externalReference', label: 'External Reference', type: 'text', col: 6 },
        ],
      },
      {
        title: 'Order Details',
        fields: [
          { name: 'orderNumber', label: 'Order Number', type: 'text', col: 4 },
          { name: 'status', label: 'Status', type: 'text', col: 4 },
          { name: 'priorityId', label: 'Priority', type: 'async-select', searchParam: { endpoint: '/lis/priorities', valueKey: 'id', labelKey: 'name' }, col: 4 },
          { name: 'requestedDate', label: 'Requested Date', type: 'text', col: 4 },
          { name: 'notes', label: 'Notes', type: 'text', col: 12 },
        ],
      },
    ],
  },
];

export const ordersConfig: ModelConfig = {
  id: 'orders',
  title: 'Orders',
  description: 'Lab orders with embedded patient info and test item assignments.',
  endpoint: '/lis/orders',
  columns,
  tabGroups,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: true,
  detailPathBuilder: (row) => `/lis/orders/${row.id}/report`,
};
