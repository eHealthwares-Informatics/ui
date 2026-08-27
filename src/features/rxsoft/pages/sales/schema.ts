import type { ModelConfig } from '../../../shared/model-schema';
import { ColumnDataType, ColumnTypeFilters, type Column, type Field } from '../../types';

const columns: Column[] = [
  // { key: 'id', label: 'ID' },
  { key: 'saleNumber', label: 'Sale #' },
  { key: 'saleChannel', label: 'Channel' },
  {
    key: 'storeId',
    label: 'Store',
    render: (row) => {
      const name = (row as Record<string, unknown>).storeName;
      return name ? String(name) : String(row.storeId ?? '-');
    },
  },
  { key: 'totalAmount', label: 'Total' },
  { key: 'status', label: 'Status' },
  { key: 'saleDate', label: 'Date', dataType: ColumnDataType.DATE, filters: ColumnTypeFilters.DATE },
];

const createFields: Field[] = [
  { name: 'saleNumber', label: 'Sale Number', required: true },
  { name: 'saleChannel', label: 'Sale Channel', required: true, placeholder: 'pos' },
  { name: 'storeId', label: 'Store ID', required: true },
  { name: 'customerId', label: 'Customer ID' },
  {
    name: 'linesJson',
    label: 'Lines JSON',
    required: true,
    type: 'textarea',
    placeholder: '[{"productId":"...","uomId":"...","quantity":1,"unitPrice":10}]',
  },
  {
    name: 'paymentsJson',
    label: 'Payments JSON',
    required: true,
    type: 'textarea',
    placeholder: '[{"paymentMethodId":"...","amount":10}]',
  },
];

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    saleNumber: values.saleNumber,
    saleChannel: values.saleChannel,
    storeId: values.storeId,
    customerId: values.customerId || undefined,
    lines: JSON.parse(String(values.linesJson ?? '[]')),
    payments: JSON.parse(String(values.paymentsJson ?? '[]')),
  };
}

export const salesConfig: ModelConfig = {
  id: 'sales',
  title: 'Sales',
  description: 'Review sales, refunds, payment filters and operational drill-down.',
  endpoint: '/sales',
  columns,
  createFields,
  buildCreatePayload,
  metricsEndpoint: '/sales/metrics',
  canExport: true,
  csvEndpoint: '/sales/export',
  metricsConfig: {
    endpoint: '/sales/metrics',
    items: (data: any) => [
      { label: 'Total Sales', value: data.totalSales, icon: 'ShoppingCart', color: 'blue' },
      { label: 'In Progress', value: data.inProgress, icon: 'Package', color: 'yellow' },
      { label: 'Revenue', value: data.totalRevenue, icon: 'DollarSign', color: 'green', format: 'currency' },
      ...Object.entries(data.byChannel ?? {}).map(([ch, info]: [string, any]) => ({
        label: `Channel: ${ch} (${info.count})`,
        value: info.count,
        icon: 'BarChart3' as const,
        color: 'cyan' as const,
      })),
      ...Object.entries(data.byCategory ?? {}).slice(0, 5).map(([cat, info]: [string, any]) => ({
        label: `Category: ${cat}`,
        value: info.revenue,
        icon: 'BarChart3' as const,
        color: 'violet' as const,
        format: 'currency' as const,
      })),
    ],
  },
};
