import type { Column, Field, Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { identityApi } from '@/lib/identity-api';

const GENDER_OPTIONS: Option[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const columns: Column[] = [
  {
    key: 'name',
    label: 'Name',
    render: (row) => (row.name as string | undefined) ?? (row.username as string) ?? '—',
  },
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  {
    key: 'roles',
    label: 'Roles',
    render: (row) => ((row.roles as string[] | undefined) ?? []).join(', '),
  },
  { key: 'isActive', label: 'Active' },
];

const userFields: Field[] = [
  { name: 'username', label: 'Username', required: true },
  { name: 'password', label: 'Password', type: 'password', required: true },
  { name: 'firstName', label: 'First name', col: 6 },
  { name: 'lastName', label: 'Last name', col: 6 },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'dateOfBirth', label: 'Date of birth', type: 'date', col: 6 },
  {
    name: 'gender',
    label: 'Gender',
    type: 'select',
    options: GENDER_OPTIONS,
    col: 6,
  },
  {
    name: 'roleCodes',
    label: 'Roles',
    type: 'multi-async-select',
    searchParam: {
      endpoint: '/roles',
      queryParam: 'search',
      valueKey: 'code',
      labelKey: 'name',
      minChars: 0,
    },
    toOptions: (values) =>
      values.map((value: any) =>
        typeof value === 'string'
          ? { value, label: value }
          : { value: value.code ?? value.value, label: value.name ?? value.label }
      ),
  },
  {
    name: 'locationId',
    label: 'Location',
    type: 'async-select',
    searchParam: {
      endpoint: '/locations',
      queryParam: 'search',
      valueKey: 'id',
      labelKey: 'name',
      minChars: 0,
    },
  },
  { name: 'loginTimeoutMinutes', label: 'Login Timeout (minutes)', type: 'number' },
  { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true },
];

function toRoleCodes(values: Record<string, unknown>): string[] {
  return Array.isArray(values.roleCodes)
    ? values.roleCodes.map((item: any) =>
        typeof item === 'string' ? item : (item.value ?? item.code ?? '')
      )
    : [];
}

/** Blank profile inputs are omitted rather than sent as "" (identity stores null). */
function profilePayload(values: Record<string, unknown>, present: (key: string) => boolean) {
  const payload: Record<string, unknown> = {};
  if (present('firstName')) {
    payload.firstName = values.firstName || null;
  }
  if (present('lastName')) {
    payload.lastName = values.lastName || null;
  }
  if (present('dateOfBirth')) {
    payload.dateOfBirth = values.dateOfBirth || null;
  }
  if (present('gender')) {
    payload.gender =
      typeof values.gender === 'string'
        ? values.gender || null
        : ((values.gender as Option | null)?.value ?? null);
  }
  return payload;
}

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    username: values.username,
    password: values.password,
    email: values.email || undefined,
    phone: values.phone || undefined,
    ...profilePayload(values, () => true),
    roleCodes: toRoleCodes(values),
    locationId: values.locationId
      ? ((values.locationId as Option).value ?? values.locationId)
      : undefined,
    loginTimeoutMinutes: values.loginTimeoutMinutes
      ? Number(values.loginTimeoutMinutes)
      : undefined,
    isActive: values.isActive ?? true,
  };
}

function buildUpdatePayload(values: Record<string, unknown>, _row?: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  if ('username' in values) {
    payload.username = values.username;
  }
  if ('password' in values && values.password) {
    payload.password = values.password;
  }
  if ('email' in values) {
    payload.email = values.email || undefined;
  }
  if ('phone' in values) {
    payload.phone = values.phone || undefined;
  }
  Object.assign(
    payload,
    profilePayload(values, (key) => key in values)
  );
  if ('roleCodes' in values) {
    payload.roleCodes = toRoleCodes(values);
  }
  if ('locationId' in values) {
    payload.locationId = values.locationId
      ? ((values.locationId as Option).value ?? values.locationId)
      : undefined;
  }
  if ('loginTimeoutMinutes' in values) {
    payload.loginTimeoutMinutes = values.loginTimeoutMinutes
      ? Number(values.loginTimeoutMinutes)
      : null;
  }
  if ('isActive' in values) {
    payload.isActive = values.isActive;
  }
  return payload;
}

function buildFormState(row: Record<string, unknown>) {
  const formState = { ...row };
  if (typeof formState.locationId === 'string' && formState.locationId) {
    formState.locationId = { value: formState.locationId, label: formState.locationId };
  }
  if (typeof formState.gender === 'string' && formState.gender) {
    formState.gender =
      GENDER_OPTIONS.find((option) => option.value === formState.gender) ?? {
        value: formState.gender,
        label: formState.gender,
      };
  }
  return formState;
}

export const identityUsersConfig: ModelConfig = {
  id: 'identity-users',
  title: 'Users',
  description:
    'User accounts, role assignments and session settings managed by the identity service.',
  endpoint: '/users',
  columns,
  createFields: userFields,
  buildCreatePayload,
  buildUpdatePayload,
  buildFormState,
  canDelete: true,
  apiProvider: identityApi,
};
