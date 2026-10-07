import {
  ColumnDataType,
  ColumnTypeFilters,
  EQUALS_WITH_OPTIONS,
  type Column,
  type FieldGroup,
  type Option,
} from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { unwrapSelectValue } from '@/features/shared/payload-utils';
import { emrApi } from '@/lib/emr-api';
import { PaymentProvidersCell } from '../../components/shared/payment-providers-cell';
import { TagChips } from '../../components/shared/tag-chips';
import { badgeCol } from '../../lib/emr-columns';
import {
  BLOOD_GROUPS,
  GENDERS,
  GENOTYPES,
  MARITAL_STATUSES,
  NEXT_OF_KIN_RELATIONSHIPS,
  toSelectData,
} from '../../lib/emr-constants';

const nameCol = (key: string, label: string): Column => ({
  key,
  label,
  render: (row) => [row.firstName, row.lastName].filter(Boolean).join(' ') || '—',
});

const columns: Column[] = [
  {
    key: 'patientId',
    label: 'MRN',
    render: (row) => String(row.patientId),
    filters: ColumnTypeFilters.STRING,
  },
  { ...nameCol('firstName', 'Name'), sortable: true },
  {
    ...badgeCol('gender', 'Gender', 'gender'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(GENDERS)),
  },
  { key: 'dateOfBirth', label: 'Date of Birth', render: (r) => String(r.dateOfBirth ?? '—') },
  { key: 'phone', label: 'Phone', render: (r) => String(r.phone ?? '—') },
  {
    key: 'paymentProviderIds',
    label: 'Payment Providers',
    render: (r) => <PaymentProvidersCell ids={r.paymentProviderIds as string[]} />,
  },
  {
    key: 'tags',
    label: 'Tags',
    render: (r) => <TagChips tags={r.tags as never} />,
  },
  {
    ...badgeCol('isActive', 'Active', 'active'),
    dataType: ColumnDataType.BOOLEAN,
    filters: ColumnTypeFilters.BOOLEAN,
  },
];

/** multi-pick / multi-async-select form values are Option[]; API wants string[] */
function toIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item : ((item as Option | null)?.value ?? '')))
    .filter(Boolean);
}

/** Schema select fields store Option {value,label} in form state; DTO wants strings. */
const SELECT_FIELDS = [
  'gender',
  'maritalStatus',
  'bloodGroup',
  'genotype',
  'nextOfKinRelationship',
] as const;

function unwrapSelectFields(values: Record<string, unknown>): Record<string, unknown> {
  const next = { ...values };
  for (const key of SELECT_FIELDS) {
    if (next[key] !== undefined) {
      next[key] = unwrapSelectValue(next[key]) ?? '';
    }
  }
  return next;
}

function compact(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== '' && value != null)
  );
}

function buildCreatePayload(values: Record<string, unknown>): Record<string, unknown> {
  const payload = compact({
    ...unwrapSelectFields(values),
    paymentProviderIds: toIdArray(values.paymentProviderIds),
  });
  // tags are assigned via PUT /patients/:id/tags after create (onCreateSuccess)
  delete payload.tags;
  return payload;
}

function buildUpdatePayload(values: Record<string, unknown>): Record<string, unknown> {
  return compact({
    ...unwrapSelectFields(values),
    paymentProviderIds:
      values.paymentProviderIds !== undefined ? toIdArray(values.paymentProviderIds) : undefined,
  });
}

function buildFormState(row: Record<string, unknown>): Record<string, unknown> {
  const paymentProviderIds = Array.isArray(row.paymentProviderIds)
    ? (row.paymentProviderIds as string[])
    : [];
  return {
    id: row.id,
    patientId: row.patientId,
    firstName: String(row.firstName ?? ''),
    lastName: String(row.lastName ?? ''),
    otherNames: String(row.otherNames ?? ''),
    gender: String(row.gender ?? ''),
    dateOfBirth: String(row.dateOfBirth ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    address: String(row.address ?? ''),
    nextOfKinName: String(row.nextOfKinName ?? ''),
    nextOfKinPhone: String(row.nextOfKinPhone ?? ''),
    nextOfKinRelationship: String(row.nextOfKinRelationship ?? ''),
    maritalStatus: String(row.maritalStatus ?? ''),
    occupation: String(row.occupation ?? ''),
    bloodGroup: String(row.bloodGroup ?? ''),
    genotype: String(row.genotype ?? ''),
    paymentProviderIds: paymentProviderIds.map((id) => ({ value: id, label: id })),
    tags: [],
  };
}

const createFieldGroups: FieldGroup[] = [
  {
    title: 'Demographics',
    fields: [
      {
        name: 'firstName',
        label: 'First name',
        type: 'text',
        required: true,
        col: 6,
        placeholder: 'Jane',
      },
      {
        name: 'lastName',
        label: 'Last name',
        type: 'text',
        required: true,
        col: 6,
        placeholder: 'Doe',
      },
      {
        name: 'otherNames',
        label: 'Other names',
        type: 'text',
        col: 6,
        placeholder: 'Middle names',
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        options: toSelectData(GENDERS),
        col: 6,
      },
      { name: 'dateOfBirth', label: 'Date of birth', type: 'date', col: 6 },
      { name: 'phone', label: 'Phone', type: 'text', col: 6, placeholder: '+2547...' },
      { name: 'email', label: 'Email', type: 'email', col: 6, placeholder: 'jane@example.com' },
      {
        name: 'maritalStatus',
        label: 'Marital status',
        type: 'select',
        options: toSelectData(MARITAL_STATUSES),
        col: 6,
      },
      { name: 'occupation', label: 'Occupation', type: 'text', col: 6 },
      { name: 'address', label: 'Address', type: 'text', col: 12, placeholder: 'Physical address' },
    ],
  },
  {
    title: 'Medical / next of kin',
    fields: [
      {
        name: 'bloodGroup',
        label: 'Blood group',
        type: 'select',
        options: toSelectData(BLOOD_GROUPS),
        col: 6,
      },
      {
        name: 'genotype',
        label: 'Genotype',
        type: 'select',
        options: toSelectData(GENOTYPES),
        col: 6,
      },
      { name: 'nextOfKinName', label: 'Next of kin name', type: 'text', col: 6 },
      { name: 'nextOfKinPhone', label: 'Next of kin phone', type: 'text', col: 6 },
      {
        name: 'nextOfKinRelationship',
        label: 'Next of kin relationship',
        type: 'select',
        options: toSelectData(NEXT_OF_KIN_RELATIONSHIPS),
        col: 6,
      },
    ],
  },
  {
    title: 'Billing & tags',
    fields: [
      {
        name: 'paymentProviderIds',
        label: 'Payment providers',
        type: 'multi-pick',
        // options injected via buildPatientsConfig — loaded from /payment-providers
        col: 12,
        placeholder: 'Select payment providers',
      },
      {
        name: 'tags',
        label: 'Tags',
        type: 'multi-async-select',
        searchParam: {
          endpoint: '/tags',
          valueKey: 'id',
          labelKey: 'name',
          queryParam: 'search',
          minChars: 0,
        },
        col: 12,
        placeholder: 'Select tags',
      },
    ],
  },
];

/**
 * Schema-forms ModelConfig for EMR patients (Register Patient = DataPageShell New).
 *
 * Tags are multi-async-select on /tags; payment providers are multi-pick with
 * options loaded by the page (see buildPatientsConfig). After create, tags are
 * assigned via PUT /patients/:id/tags in onCreateSuccess (create DTO has no tagIds).
 */
export function buildPatientsConfig(paymentProviderOptions: Option[] = []): ModelConfig {
  const fieldGroups = createFieldGroups.map((group) => ({
    ...group,
    fields: group.fields.map((field) =>
      field.name === 'paymentProviderIds' ? { ...field, options: paymentProviderOptions } : field
    ),
  }));

  return {
    id: 'patients',
    title: 'Patients',
    description: 'Search and manage patient demographic records.',
    endpoint: '/patients',
    apiProvider: emrApi,
    queryKeyBase: ['emr', 'patients'],
    columns,
    createFieldGroups: fieldGroups,
    modalTitle: 'Register Patient',
    defaultState: {
      firstName: '',
      lastName: '',
      otherNames: '',
      gender: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      address: '',
      nextOfKinName: '',
      nextOfKinPhone: '',
      nextOfKinRelationship: '',
      maritalStatus: '',
      occupation: '',
      bloodGroup: '',
      genotype: '',
      paymentProviderIds: [],
      tags: [],
    },
    buildFormState,
    buildCreatePayload,
    buildUpdatePayload,
    onCreateSuccess: async (created, values) => {
      const patientId = String(created?.id ?? '');
      const tagIds = toIdArray(values.tags);
      if (patientId && tagIds.length > 0) {
        await emrApi.put(`/patients/${patientId}/tags`, { tagIds });
      }
    },
    detailPathBuilder: (row) => `/emr/patients/${String(row.id)}`,
    canCreate: true,
    canDelete: true,
    defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
  };
}

/** Config without remote payment-provider options (list-only / tests). */
export const patientsConfig: ModelConfig = buildPatientsConfig();
