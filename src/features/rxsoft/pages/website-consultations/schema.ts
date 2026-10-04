import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'channel', label: 'Channel' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Requested', sortable: true },
];

const createFields: Field[] = [
  { name: 'name', label: 'Name', required: true, col: 6 },
  { name: 'phone', label: 'Phone', required: true, col: 6 },
  { name: 'email', label: 'Email', type: 'email', col: 6 },
  {
    name: 'channel',
    label: 'Channel',
    type: 'select',
    col: 6,
    options: [
      { value: 'WhatsApp', label: 'WhatsApp' },
      { value: 'Phone', label: 'Phone' },
      { value: 'Video Call', label: 'Video Call' },
    ],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    col: 6,
    options: [
      { value: 'Pending', label: 'Pending' },
      { value: 'In Progress', label: 'In Progress' },
      { value: 'Completed', label: 'Completed' },
      { value: 'Cancelled', label: 'Cancelled' },
    ],
  },
  { name: 'symptoms', label: 'Symptoms', type: 'textarea', col: 12 },
  { name: 'questions', label: 'Questions', type: 'textarea', col: 12 },
  { name: 'pharmacistNotes', label: 'Pharmacist Notes', type: 'textarea', col: 12 },
];

function buildPayload(values: Record<string, unknown>) {
  return {
    name: values.name,
    phone: values.phone,
    email: values.email || undefined,
    channel: values.channel || undefined,
    status: values.status || undefined,
    symptoms: values.symptoms || undefined,
    questions: values.questions || undefined,
    pharmacistNotes: values.pharmacistNotes || undefined,
  };
}

export const consultationsConfig: ModelConfig = {
  id: 'website-consultations',
  title: 'Consultations',
  description: 'Pharmacist consultation requests from the storefront.',
  endpoint: '/website/admin/consultations',
  columns,
  createFields,
  buildCreatePayload: buildPayload,
  buildUpdatePayload: buildPayload,
  canDelete: true,
};
