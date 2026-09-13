import type { ModelConfig } from '../../../shared/model-schema';
import { ColumnDataType, ColumnTypeFilters, FILTERS, type Column } from '../../types';

const statusOptions = [
  { value: 'initiated', label: 'Initiated' },
  { value: 'pending', label: 'Pending' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'reversed', label: 'Reversed' },
  { value: 'settled', label: 'Settled' },
];

const columns: Column[] = [
  { key: 'reference', label: 'Reference', filters: ColumnTypeFilters.STRING },
  { key: 'amount', label: 'Amount', dataType: ColumnDataType.NUMBER, filters: ColumnTypeFilters.NUMBER },
  { key: 'amountPaid', label: 'Amount Paid', dataType: ColumnDataType.NUMBER },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status', filters: [FILTERS.EQUALS, FILTERS.NOT_EQUALS] },
  { key: 'channel', label: 'Channel' },
  { key: 'sourceType', label: 'Source' },
  { key: 'paymentMethodId', label: 'Method' },
  { key: 'createdAt', label: 'Created', dataType: ColumnDataType.DATE, filters: ColumnTypeFilters.DATE },
];

export const paymentTransactionsConfig: ModelConfig = {
  id: 'payment-transactions',
  title: 'Payment Transactions',
  description: 'Detailed payment transaction records with verify capability.',
  endpoint: '/payments',
  columns,
};
