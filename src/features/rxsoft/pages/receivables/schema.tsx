import type { ModelConfig } from '../../../shared/model-schema';
import type { Column } from '../../types';

const columns: Column[] = [
  { key: 'id', label: 'ID' },
  { key: 'customerId', label: 'Customer', render: (row) => ((row.customer as { name?: string } | undefined)?.name ?? row.customerId) as string },
  { key: 'status', label: 'Status' },
  { key: 'originalAmount', label: 'Original Amount' },
  { key: 'outstandingAmount', label: 'Outstanding Amount' },
];

export const receivablesConfig: ModelConfig = {
  id: 'receivables',
  title: 'Receivables',
  description: 'Track outstanding receivables.',
  endpoint: '/receivables',
  columns,
};
