import type { ModelConfig } from '../../../shared/model-schema';
import { ColumnDataType, ColumnTypeFilters, type Column } from '../../types';

/**
 * Website-orders list columns.
 *
 * Only the Date column is sortable (backend sortBy/sortOrder); everything else
 * opts out. Origin / Ext Ref / Items were removed from the list — the detail
 * sub-page carries them.
 */
export const websiteOrdersColumns: Column[] = [
  { key: 'orderNumber', label: 'Order #', filters: ColumnTypeFilters.STRING, sortable: false },
  {
    key: 'customer',
    label: 'Customer',
    sortable: false,
    render: (row: any) =>
      row.customer?.name ?? row.customerName ?? row.delivery?.recipientName ?? '—',
  },
  {
    key: 'createdAt',
    label: 'Date',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
    sortable: true,
    render: (row: any) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'),
  },
  { key: 'totalAmount', label: 'Total', dataType: ColumnDataType.NUMBER, sortable: false },
  {
    key: 'status',
    label: 'Status',
    filters: ColumnTypeFilters.STRING,
    sortable: false,
  },
  {
    key: 'paymentMethod',
    label: 'Payment',
    filters: ColumnTypeFilters.STRING,
    sortable: false,
  },
];

export const websiteOrdersConfig: ModelConfig = {
  id: 'website-orders',
  title: 'Orders',
  description: 'Manage and fulfill orders.',
  endpoint: '/website/admin/orders',
  columns: websiteOrdersColumns,
  canExport: true,
  // Dedicated orders export: same filters, no pagination.
  csvEndpoint: '/orders/admin/orders/export',
};
