import type { Column, TabGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { buildPayload } from '@/features/shared/payload-utils';

const columns: Column[] = [
  { key: 'patientId', label: 'MRN' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'dateOfBirth', label: 'DOB' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
];

const tabGroups: TabGroup[] = [
  {
    title: 'Patient',
    value: 'patient',
    fieldGroups: [
      {
        title: 'Basic Information',
        fields: [
          { name: 'patientId', label: 'MRN', type: 'text', required: true, col: 4 },
          { name: 'firstName', label: 'First Name', type: 'text', required: true, col: 4 },
          { name: 'lastName', label: 'Last Name', type: 'text', required: true, col: 4 },
          { name: 'gender', label: 'Gender', type: 'select', options: [{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }, { value: 'UNKNOWN', label: 'Unknown' }], col: 3 },
          { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', col: 3 },
          { name: 'phone', label: 'Phone', type: 'text', col: 3 },
          { name: 'email', label: 'Email', type: 'text', col: 3 },
        ],
      },
      {
        title: 'Contact',
        fields: [
          { name: 'address', label: 'Address', type: 'textarea', col: 12 },
        ],
      },
    ],
  },
];

export const patientsConfig: ModelConfig = {
  id: 'patients',
  title: 'Patients',
  description: 'Manage patient records.',
  endpoint: '/lis/patients',
  columns,
  tabGroups,
  buildCreatePayload: (v) => buildPayload(v),
  buildUpdatePayload: (v) => buildPayload(v),
};