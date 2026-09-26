import type { ModelConfig } from '../../../shared/model-schema';
import { ColumnDataType, ColumnTypeFilters, type Column } from '../../types';

export const websiteOrdersColumns: Column[] = [
  { key: 'orderNumber', label: 'Order #', filters: ColumnTypeFilters.STRING },
  {
    key: 'origin',
    label: 'Origin',
    filters: ColumnTypeFilters.STRING,
    render: (row: any) => (row.origin === 'emr-encounter-request' ? 'EMR Request' : row.origin ?? 'website'),
  },
  {
    key: 'externalReference',
    label: 'Ext Ref',
    render: (row: any) => row.externalReference ?? '-',
  },
  {
    key: 'createdAt',
    label: 'Date',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
    render: (row: any) =>
      row.createdAt ? new Date(row.createdAt).toLocaleString() : '-',
  },
  {
    key: 'items',
    label: 'Items',
    render: (row: any) => (row.items?.length ?? 0),
  },
  { key: 'totalAmount', label: 'Total', dataType: ColumnDataType.NUMBER },
  {
    key: 'status',
    label: 'Status',
    filters: ColumnTypeFilters.STRING,
  },
  {
    key: 'paymentMethod',
    label: 'Payment',
    filters: ColumnTypeFilters.STRING,
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