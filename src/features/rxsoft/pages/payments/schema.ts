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

const channelOptions = [
  { value: 'web', label: 'Web' },
  { value: 'pos', label: 'POS' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'gateway', label: 'Gateway' },
];

const columns: Column[] = [
  { key: 'reference', label: 'Reference', filters: ColumnTypeFilters.STRING },
  { key: 'amount', label: 'Amount', dataType: ColumnDataType.NUMBER, filters: ColumnTypeFilters.NUMBER },
  { key: 'amountPaid', label: 'Amount Paid', dataType: ColumnDataType.NUMBER },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status', filters: [FILTERS.EQUALS, FILTERS.NOT_EQUALS] },
  { key: 'channel', label: 'Channel', filters: [FILTERS.EQUALS] },
  { key: 'sourceType', label: 'Source' },
  { key: 'createdAt', label: 'Date', dataType: ColumnDataType.DATE, filters: ColumnTypeFilters.DATE },
];

export const paymentsConfig: ModelConfig = {
  id: 'payments',
  title: 'Payments',
  description: 'All payment transactions processed through the system.',
  endpoint: '/payments',
  columns,
};
