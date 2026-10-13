import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const accountTypeOptions = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

const columns: Column[] = [
  { key: 'accountCode', label: 'Code' },
  { key: 'accountName', label: 'Name' },
  { key: 'accountType', label: 'Type' },
  { key: 'allowsReconciliation', label: 'Reconcilable' },
  { key: 'isActive', label: 'Active' },
];

const createFields: Field[] = [
  { name: 'accountCode', label: 'Account Code', required: true },
  { name: 'accountName', label: 'Account Name', required: true },
  {
    name: 'accountType',
    label: 'Account Type',
    required: true,
    type: 'select',
    options: accountTypeOptions,
  },
  {
    name: 'allowsReconciliation',
    label: 'Allows Reconciliation',
    type: 'switch',
    defaultValue: false,
  },
  { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    accountCode: values.accountCode,
    accountName: values.accountName,
    accountType: (values.accountType as any).value,
    allowsReconciliation: values.allowsReconciliation ?? false,
    isActive: values.isActive ?? true,
  };
}

// Enables the row-level edit action (ui#785). PATCH /gl-accounts/:id already
// exists; accountType support was added alongside it.
function buildUpdatePayload(values: Record<string, unknown>) {
  return {
    accountCode: (values.accountCode as string) || undefined,
    accountName: (values.accountName as string) || undefined,
    accountType: (values.accountType as any)?.value ?? values.accountType,
    allowsReconciliation: values.allowsReconciliation,
    isActive: values.isActive,
  };
}

export const glAccountsConfig: ModelConfig = {
  id: 'gl-accounts',
  title: 'Chart of Accounts',
  description: 'General ledger accounts used for financial reporting.',
  endpoint: '/gl-accounts',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
