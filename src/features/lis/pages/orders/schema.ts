import type { Column, Option, TabGroup } from '@/features/rxsoft/types';
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
          {
            name: 'patientGender',
            label: 'Gender',
            type: 'select',
            options: [
              { value: 'MALE', label: 'MALE' },
              { value: 'FEMALE', label: 'FEMALE' },
              { value: 'OTHER', label: 'OTHER' },
              { value: 'UNKNOWN', label: 'UNKNOWN' },
            ],
            col: 3,
          },
          { name: 'patientDateOfBirth', label: 'Date of Birth', type: 'date', col: 3 },
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
          {
            name: 'priorityId',
            label: 'Priority',
            type: 'async-select',
            searchParam: { endpoint: '/lis/priorities', valueKey: 'id', labelKey: 'name' },
            col: 4,
          },
          { name: 'requestedDate', label: 'Requested Date', type: 'date', col: 4 },
          {
            name: 'testIds',
            label: 'Tests',
            type: 'multi-async-select',
            searchParam: { endpoint: '/lis/test-definitions', valueKey: 'id', labelKey: 'name' },
            col: 12,
          },
          { name: 'notes', label: 'Notes', type: 'textarea', col: 12 },
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
  buildCreatePayload: toApiPayload,
  buildUpdatePayload: toApiPayload,
  buildFormState,
  canDelete: true,
  detailPathBuilder: (row) => `/lis/orders/${row.id}/report`,
};

/** Converts the form's testIds (Option[] or id[]) into the backend's items array */
function toApiPayload(v: Record<string, unknown>) {
  const ids = (Array.isArray(v.testIds) ? v.testIds : [])
    .map((item: unknown) =>
      typeof item === 'string' ? item : ((item as Option)?.value ?? (item as any)?.id ?? '')
    )
    .filter(Boolean);
  const payload: Record<string, unknown> = {
    ...v,
    patientGender: unwrapOption(v.patientGender),
    priorityId: unwrapOption(v.priorityId),
    patientAge: v.patientAge === '' || v.patientAge == null ? null : Number(v.patientAge),
  };
  payload.items = ids.map((testDefinitionId) => ({ testDefinitionId }));
  delete payload.testIds;
  return payload;
}

/** Select/async-select form values arrive as { value, label }; send just the value */
function unwrapOption(v: unknown): unknown {
  if (v !== null && typeof v === 'object' && 'value' in (v as Record<string, unknown>)) {
    return (v as Record<string, unknown>).value;
  }
  return v;
}

/** Loads the backend's items array into testIds Options for the form */
function buildFormState(row: Record<string, unknown>) {
  const state: Record<string, unknown> = { ...row };
  state.testIds = (Array.isArray(row.items) ? row.items : []).map((item: any) => ({
    value: item.testDefinitionId ?? item.testDefinition?.id,
    label: item.testName ?? item.testDefinition?.name ?? item.testDefinitionId,
  }));
  delete state.items;
  return state;
}
