import { Badge } from '@mantine/core';
import type { ModelConfig } from '../../../shared/model-schema';
import { ColumnDataType, ColumnTypeFilters, FILTERS, type Column } from '../../types';

/** Tabs on the consolidated order-listing screen. */
export const ORDER_LISTING_TABS = [
  { value: 'orders', label: 'Orders' },
  { value: 'prescriptions', label: 'Prescriptions' },
  { value: 'sales', label: 'Sales' },
  { value: 'reminders', label: 'Reminders' },
] as const;

export type OrderListingTab = (typeof ORDER_LISTING_TABS)[number]['value'];

const date = (row: Record<string, unknown>, key: string) =>
  row[key] ? new Date(String(row[key])).toLocaleString() : '-';

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  confirmed: 'cyan',
  processing: 'blue',
  dispatched: 'violet',
  in_transit: 'indigo',
  delivered: 'green',
  cancelled: 'red',
};

const statusLabel = (s: unknown) =>
  String(s ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

// ── Orders (website orders) ─────────────────────────────────────────────────
const orderColumns: Column[] = [
  { key: 'orderNumber', label: 'Order #', filters: ColumnTypeFilters.STRING },
  {
    key: 'origin',
    label: 'Origin',
    filters: ColumnTypeFilters.STRING,
    render: (row) =>
      row.origin === 'emr-encounter-request' ? 'EMR Request' : String(row.origin ?? 'website'),
  },
  { key: 'items', label: 'Items', render: (row) => (row.items as unknown[])?.length ?? 0 },
  { key: 'totalAmount', label: 'Total', dataType: ColumnDataType.NUMBER },
  {
    key: 'status',
    label: 'Status',
    filters: ColumnTypeFilters.STRING,
    render: (row) => (
      <Badge color={ORDER_STATUS_COLORS[String(row.orderStatus ?? 'pending')] ?? 'gray'}>
        {statusLabel(row.orderStatus ?? 'pending')}
      </Badge>
    ),
  },
  {
    key: 'createdAt',
    label: 'Date',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
    sortable: true,
    render: (row) => date(row, 'createdAt'),
  },
];

export const ordersListConfig: ModelConfig = {
  id: 'orders-listing',
  title: 'Orders',
  description: 'Website orders across every status.',
  endpoint: '/website/admin/orders',
  columns: orderColumns,
  canDelete: false,
  canExport: true,
  csvEndpoint: '/orders/admin/orders/export',
  defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
};

// ── Prescriptions ───────────────────────────────────────────────────────────
const PRESCRIPTION_STATUS_COLORS: Record<string, string> = {
  Pending: 'gray',
  'Under Review': 'yellow',
  Approved: 'green',
  Rejected: 'red',
  Fulfilled: 'blue',
};

const prescriptionColumns: Column[] = [
  { key: 'name', label: 'Name', filters: ColumnTypeFilters.STRING },
  { key: 'phone', label: 'Phone', filters: ColumnTypeFilters.STRING },
  { key: 'email', label: 'Email', filters: ColumnTypeFilters.STRING },
  {
    key: 'status',
    label: 'Status',
    filters: [FILTERS.EQUALS, FILTERS.NOT_EQUALS],
    render: (row) => (
      <Badge color={PRESCRIPTION_STATUS_COLORS[String(row.status)] ?? 'gray'}>
        {String(row.status ?? '-')}
      </Badge>
    ),
  },
  {
    key: 'createdAt',
    label: 'Date',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
    sortable: true,
    render: (row) => date(row, 'createdAt'),
  },
];

export const prescriptionsListConfig: ModelConfig = {
  id: 'prescriptions-listing',
  title: 'Prescriptions',
  description: 'Prescription submissions from the website.',
  endpoint: '/website/admin/prescriptions',
  columns: prescriptionColumns,
  canDelete: false,
  defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
};

// ── Sales ───────────────────────────────────────────────────────────────────
const SALE_STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  posted: 'green',
  voided: 'red',
  refunded: 'orange',
};

const salesColumns: Column[] = [
  { key: 'saleNumber', label: 'Sale #', filters: ColumnTypeFilters.STRING },
  { key: 'saleChannel', label: 'Channel', filters: ColumnTypeFilters.STRING },
  { key: 'totalAmount', label: 'Total', dataType: ColumnDataType.NUMBER },
  {
    key: 'status',
    label: 'Status',
    filters: ColumnTypeFilters.STRING,
    render: (row) => (
      <Badge color={SALE_STATUS_COLORS[String(row.status)] ?? 'gray'}>
        {statusLabel(row.status)}
      </Badge>
    ),
  },
  {
    key: 'saleDate',
    label: 'Date',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
    sortable: true,
    render: (row) => date(row, 'saleDate'),
  },
];

export const salesListConfig: ModelConfig = {
  id: 'sales-listing',
  title: 'Sales',
  description: 'POS, invoice and mobile sales.',
  endpoint: '/sales',
  columns: salesColumns,
  canDelete: false,
  canExport: true,
  csvEndpoint: '/sales/export',
  defaultSort: { sortBy: 'saleDate', sortOrder: 'desc' },
};

// ── Reminders (refills) ─────────────────────────────────────────────────────
const REFILL_STATUS_COLORS: Record<string, string> = {
  scheduled: 'blue',
  due: 'orange',
  completed: 'green',
  cancelled: 'gray',
};

export const reminderColumns: Column[] = [
  { key: 'itemName', label: 'Item', filters: ColumnTypeFilters.STRING },
  { key: 'patientName', label: 'Patient', filters: ColumnTypeFilters.STRING },
  { key: 'quantity', label: 'Qty', dataType: ColumnDataType.NUMBER },
  { key: 'intervalDays', label: 'Every (days)', dataType: ColumnDataType.NUMBER },
  {
    key: 'nextDueDate',
    label: 'Next due',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
    sortable: true,
    render: (row) => date(row, 'nextDueDate'),
  },
  {
    key: 'status',
    label: 'Status',
    filters: ColumnTypeFilters.STRING,
    render: (row) => (
      <Badge color={REFILL_STATUS_COLORS[String(row.status)] ?? 'gray'}>
        {statusLabel(row.status)}
      </Badge>
    ),
  },
  {
    key: 'createdAt',
    label: 'Created',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
    sortable: true,
    render: (row) => date(row, 'createdAt'),
  },
];
