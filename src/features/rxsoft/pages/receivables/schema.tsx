import { Badge } from '@mantine/core';
import type { ModelConfig } from '../../../shared/model-schema';
import type { Column } from '../../types';

const columns: Column[] = [
  { key: 'id', label: 'ID' },
  { key: 'customerId', label: 'Customer', render: (row) => ((row.customer as { name?: string } | undefined)?.name ?? row.customerId) as string },
  {
    key: 'saleNumber',
    label: 'Sale',
    render: (row: any) =>
      row.saleId ? (
        <Badge
          color="green"
          variant="light"
          size="sm"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            window.location.href = `/rxsoft/sales-lines?saleId=${row.saleId}`;
          }}
        >
          {row.saleNumber ?? 'View sale'}
        </Badge>
      ) : (
        <Badge color="gray" variant="light" size="sm">—</Badge>
      ),
  },
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
