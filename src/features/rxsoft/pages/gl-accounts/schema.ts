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

export const glAccountsConfig: ModelConfig = {
  id: 'gl-accounts',
  title: 'Chart of Accounts',
  description: 'General ledger accounts used for financial reporting.',
  endpoint: '/gl-accounts',
  columns,
  createFields,
  buildCreatePayload,
  canDelete: true,
};
