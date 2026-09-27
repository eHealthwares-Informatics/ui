import type { ModelConfig } from '../../../shared/model-schema';
import type { Column } from '../../types';

const columns: Column[] = [
  { key: 'receiptNumber', label: 'Receipt #' },
  {
    key: 'purchaseOrder',
    label: 'PO #',
    render: (row) =>
      (row.purchaseOrder as { purchaseOrderNumber?: string })?.purchaseOrderNumber ?? '-',
  },
  {
    key: 'receivedDate',
    label: 'Date',
    render: (row) =>
      row.receivedDate ? new Date(row.receivedDate as string).toLocaleDateString() : '-',
  },
  {
    key: 'lines',
    label: 'Items',
    render: (row) => String(((row.lines as unknown[]) ?? []).length),
  },
  { key: 'note', label: 'Note' },
];

export const receivingConfig: ModelConfig = {
  id: 'receiving',
  title: 'Goods Receiving',
  description: 'View and manage goods receipts from purchase orders.',
  endpoint: '/receipts',
  columns,
  canDelete: false,
  canExport: false,
};
