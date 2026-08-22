import type { ModelConfig } from '../../../shared/model-schema';
import { Option, type Column, type Field, type TabGroup } from '../../types';

const columns: Column[] = [
  { key: 'id', label: 'ID' },
  { key: 'username', label: 'Username' },
  {
    key: 'roles',
    label: 'Roles',
    render: (row) => (((row.roles as any).map((row: any) => row.name) as string[] | undefined) ?? []).join(', '),
  },
];

const userCreateFields: Field[] = [
  { name: 'username', label: 'Username', required: true },
  { name: 'password', label: 'Password', type: 'password', required: true },
  {
    name: 'roles',
    label: 'Roles',
    type: 'multi-async-select' as any,
    toOptions: (values) =>
      values.map((value: any) =>
        typeof value === 'string'
          ? { value, label: value }
          : { value: value.code ?? value.value, label: value.name ?? value.label },
      ),
    required: true,
    searchParam: {
      endpoint: '/roles',
      queryParam: 'search',
      valueKey: 'code',
      labelKey: 'name',
      minChars: 0,
    },
  },
];

const posConfigFields: Field[] = [
  {
    name: 'storeId',
    label: 'Store ID',
    placeholder: 'default',
    col: 6,
  },
  {
    name: 'stockLocationId',
    label: 'Stock Location',
    type: 'async-select',
    searchParam: {
      endpoint: '/stock-locations',
      queryParam: 'search',
      valueKey: 'id',
      labelKey: 'name',
      minChars: 0,
    },
    col: 6,
  },
  {
    name: 'defaultCustomerId',
    label: 'Default Customer',
    type: 'async-select',
    searchParam: {
      endpoint: '/customers',
      queryParam: 'search',
      valueKey: 'id',
      labelKey: 'name',
      minChars: 0,
    },
    col: 6,
  },
  {
    name: 'defaultPriceListId',
    label: 'Default Price List',
    type: 'async-select',
    searchParam: {
      endpoint: '/price-lists',
      queryParam: 'search',
      valueKey: 'id',
      labelKey: 'name',
      minChars: 0,
    },
    col: 6,
  },
  {
    name: 'loginTimeoutMinutes',
    label: 'Login Timeout (minutes)',
    type: 'number',
    placeholder: '480',
    col: 4,
  },
  {
    name: 'allowPos',
    label: 'Allow POS',
    type: 'switch',
    defaultValue: true,
    col: 4,
  },
  {
    name: 'allowA4Print',
    label: 'Allow A4 Print',
    type: 'switch',
    defaultValue: false,
    col: 4,
  },
  {
    name: 'autoSelectLocation',
    label: 'Auto-select Location',
    type: 'switch',
    defaultValue: false,
    col: 4,
  },
  {
    name: 'autoSelectCustomer',
    label: 'Auto-select Customer',
    type: 'switch',
    defaultValue: false,
    col: 4,
  },
  {
    name: 'autoSelectPriceList',
    label: 'Auto-select Price List',
    type: 'switch',
    defaultValue: false,
    col: 4,
  },
];

const tabGroups: TabGroup[] = [
  {
    title: 'User Details',
    value: 'user-details',
    fieldGroups: [{ fields: userCreateFields }],
  },
  {
    title: 'POS Config',
    value: 'pos-config',
    fieldGroups: [{ fields: posConfigFields }],
  },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    username: values.username,
    password: values.password,
    roleCodes: Array.isArray(values.roles)
      ? values.roles.map((item: any) => (typeof item === 'string' ? item : item.value ?? item.code ?? ''))
      : [],
    posConfig: {
      storeId: values.storeId || undefined,
      stockLocationId: values.stockLocationId
        ? (values.stockLocationId as Option).value
        : undefined,
      defaultCustomerId: values.defaultCustomerId
        ? (values.defaultCustomerId as Option).value
        : undefined,
      defaultPriceListId: values.defaultPriceListId
        ? (values.defaultPriceListId as Option).value
        : undefined,
      allowPos: values.allowPos ?? true,
      allowA4Print: values.allowA4Print ?? false,
      loginTimeoutMinutes: values.loginTimeoutMinutes ? Number(values.loginTimeoutMinutes) : undefined,
      autoSelectLocation: values.autoSelectLocation ?? false,
      autoSelectCustomer: values.autoSelectCustomer ?? false,
      autoSelectPriceList: values.autoSelectPriceList ?? false,
    },
  };
}

function buildUpdatePayload(values: Record<string, unknown>, _row?: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  if ('username' in values) {payload.username = values.username;}
  if ('password' in values) {payload.password = values.password;}
  if ('roles' in values) {
    payload.roleCodes = Array.isArray(values.roles)
      ? values.roles.map((item: any) => (typeof item === 'string' ? item : item.value ?? item.code ?? ''))
      : [];
  }

  const posKeys = ['storeId', 'stockLocationId', 'defaultCustomerId', 'defaultPriceListId',
    'loginTimeoutMinutes', 'allowPos', 'allowA4Print', 'autoSelectLocation',
    'autoSelectCustomer', 'autoSelectPriceList'] as const;
  const hasPosChanges = posKeys.some((k) => k in values);
  if (hasPosChanges) {
    const posConfig: Record<string, unknown> = {};
    if ('storeId' in values) {posConfig.storeId = values.storeId || null;}
    if ('stockLocationId' in values) {posConfig.stockLocationId = values.stockLocationId ? (values.stockLocationId as Option).value : null;}
    if ('defaultCustomerId' in values) {posConfig.defaultCustomerId = values.defaultCustomerId ? (values.defaultCustomerId as Option).value : null;}
    if ('defaultPriceListId' in values) {posConfig.defaultPriceListId = values.defaultPriceListId ? (values.defaultPriceListId as Option).value : null;}
    if ('loginTimeoutMinutes' in values) {posConfig.loginTimeoutMinutes = values.loginTimeoutMinutes ? Number(values.loginTimeoutMinutes) : null;}
    if ('allowPos' in values) {posConfig.allowPos = values.allowPos;}
    if ('allowA4Print' in values) {posConfig.allowA4Print = values.allowA4Print;}
    if ('autoSelectLocation' in values) {posConfig.autoSelectLocation = values.autoSelectLocation;}
    if ('autoSelectCustomer' in values) {posConfig.autoSelectCustomer = values.autoSelectCustomer;}
    if ('autoSelectPriceList' in values) {posConfig.autoSelectPriceList = values.autoSelectPriceList;}
    payload.posConfig = posConfig;
  }

  return payload;
}

function buildFormState(row: Record<string, unknown>) {
  const formState = { ...row };
  const posConfig = row.posConfig as Record<string, unknown> | undefined;
  if (posConfig) {
    if (posConfig.stockLocationId) {
      const loc = posConfig.stockLocation as { id?: string; name?: string } | undefined;
      formState.stockLocationId = loc?.id
        ? { value: loc.id, label: loc.name ?? loc.id }
        : posConfig.stockLocationId;
    }
    if (posConfig.storeId) {
      formState.storeId = posConfig.storeId;
    }
    if (posConfig.defaultCustomerId) {
      const cust = posConfig.defaultCustomer as { id?: string; name?: string } | undefined;
      formState.defaultCustomerId = cust?.id
        ? { value: cust.id, label: cust.name ?? cust.id }
        : posConfig.defaultCustomerId;
    }
    if (posConfig.defaultPriceListId) {
      const pl = posConfig.defaultPriceList as { id?: string; name?: string } | undefined;
      formState.defaultPriceListId = pl?.id
        ? { value: pl.id, label: pl.name ?? pl.id }
        : posConfig.defaultPriceListId;
    }
    if (posConfig.allowPos !== undefined) {
      formState.allowPos = posConfig.allowPos;
    }
    if (posConfig.allowA4Print !== undefined) {
      formState.allowA4Print = posConfig.allowA4Print;
    }
    if (posConfig.loginTimeoutMinutes) {
      formState.loginTimeoutMinutes = posConfig.loginTimeoutMinutes;
    }
    if (posConfig.autoSelectLocation !== undefined) {
      formState.autoSelectLocation = posConfig.autoSelectLocation;
    }
    if (posConfig.autoSelectCustomer !== undefined) {
      formState.autoSelectCustomer = posConfig.autoSelectCustomer;
    }
    if (posConfig.autoSelectPriceList !== undefined) {
      formState.autoSelectPriceList = posConfig.autoSelectPriceList;
    }
  }
  return formState;
}

export const usersConfig: ModelConfig = {
  id: 'users',
  title: 'Users',
  description: 'User lifecycle management, activation, assignment and traceability.',
  endpoint: '/users',
  columns,
  tabGroups,
  buildCreatePayload,
  buildUpdatePayload,
  buildFormState,
  canDelete: true,
};
