import type { ModelConfig } from '../../../shared/model-schema';
import { RELATION_FILTER, type Column, type Field, type View } from '../../types';

const columns: Column[] = [
  { key: 'invoiceNumber', label: 'PO/Invoice' },
  { key: 'supplier.name', label: 'Supplier', filters: RELATION_FILTER({ endpoint: '/customers', queryParam: 'search', valueKey: 'id', labelKey: 'name', minChars: 2 }) },
  { key: 'warehouse.name', label: 'Warehouse', filters: RELATION_FILTER({ endpoint: '/stock-locations', queryParam: 'search', valueKey: 'id', labelKey: 'name', minChars: 0 }) },
  { key: 'currencyCode', label: 'Currency' },
  { key: 'totalCost', label: 'Total Cost' },
  { key: 'status', label: 'Status' },
  {
    key: 'lines',
    label: 'Lines',
    render: (row) => String(((row.lines as unknown[]) ?? []).length),
  },
];

const createFields: Field[] = [
  {
    name: 'supplier',
    label: 'Supplier',
    type: 'async-select',
    required: true,
    searchParam: {
      endpoint: '/customers',
      queryParam: 'search',
      valueKey: 'id',
      labelKey: 'name',
      minChars: 2,
    },
  },
  {
    name: 'warehouse',
    label: 'Warehouse',
    type: 'async-select',
    required: true,
    searchParam: {
      endpoint: '/stock-locations',
      queryParam: 'search',
      valueKey: 'id',
      labelKey: 'name',
      minChars: 0,
    },
  },
  { name: 'productId', label: 'Product ID', required: true },
  {
    name: 'purchaseUom',
    label: 'Purchase UOM',
    type: 'async-select',
    searchParam: {
      endpoint: '/uoms',
      minChars: 2,
      queryParam: 'search',
      labelKey: 'name',
      valueKey: 'id',
    },
    col: 4,
  },
  { name: 'quantity', label: 'Quantity', type: 'number', required: true },
  { name: 'unitCost', label: 'Unit Cost', type: 'number', required: true },
  { name: 'invoiceNumber', label: 'Invoice/PO Number' },
  { name: 'currencyCode', label: 'Currency Code', placeholder: 'NGN' },
  { name: 'status', label: 'Status', placeholder: 'draft' },
  { name: 'note', label: 'Note' },
];

export const purchaseLineEditConfig: ModelConfig = {
  id: 'purchase-lines',
  title: 'Purchase Line',
  description: 'Adjust unit cost and received quantity before the purchase order is received.',
  endpoint: '/purchases/:purchaseId/lines',
  columns: [
    { key: 'itemName', label: 'Item' },
    { key: 'orderedQty', label: 'Ordered Qty' },
    { key: 'receivedQty', label: 'Received Qty' },
    { key: 'unitCost', label: 'Unit Cost Price' },
  ],
  createFields: [
    { name: 'unitCost', label: 'Unit Cost Price', type: 'number', required: true, min: 0 },
    { name: 'receivedQty', label: 'Received Qty', type: 'number', min: 0 },
  ],
  buildFormState: (row) => ({
    unitCost: row.unitCost,
    receivedQty: row.receivedQty,
  }),
  buildUpdatePayload: (values) => {
    const payload: Record<string, unknown> = {};
    if (values.unitCost !== undefined) {
      payload.unitCost = Number(values.unitCost);
    }
    if (values.receivedQty !== undefined) {
      payload.receivedQty = Number(values.receivedQty);
    }
    return payload;
  },
};

const purchasesView: View<any> = {
  endpoint: '/purchases/:id',
  title: 'Purchase Order',
  fieldGroups: [
    {
      fields: [
        { key: 'invoiceNumber', label: 'PO Number', col: 4 },
        { key: 'supplier.name', label: 'Supplier', col: 4, render: (_, data) => data.supplier?.name ?? '-' },
        { key: 'warehouse.name', label: 'Warehouse', col: 4, render: (_, data) => data.warehouse?.name ?? '-' },
        { key: 'orderDate', label: 'Order Date', col: 3 },
        { key: 'expectedDate', label: 'Expected Date', col: 3 },
        { key: 'status', label: 'Status', col: 3 },
        { key: 'currencyCode', label: 'Currency', col: 3 },
        { key: 'totalCost', label: 'Total Cost', col: 3 },
        { key: 'note', label: 'Note', col: 12 },
      ],
    },
  ],
  accordions: [
    {
      key: 'lines',
      title: 'Purchase Lines',
      renderLabel: (item) =>
        `${item.itemName} \u2014 ${item.receivedQty} ${item.uomName} @ $${Number(item.unitCost).toFixed(2)} = $${Number(item.lineTotal).toFixed(2)}`,
      itemEditConfig: purchaseLineEditConfig,
      itemEditEndpoint: (data) => `/purchases/${data.id}/lines`,
      canEditItem: (data) => !['received', 'cancelled'].includes(data?.status),
    },
  ],
};

function buildCreatePayload(values: Record<string, unknown>) {
  return {
    supplierId: values.supplier ? (values.supplier as { value: string }).value : values.supplierId,
    warehouseId: values.warehouse ? (values.warehouse as { value: string }).value : values.warehouseId,
    productId: values.productId,
    purchaseUomId: values.purchaseUom ? (values.purchaseUom as { value: string }).value : undefined,
    quantity: Number(values.quantity || 0),
    unitCost: Number(values.unitCost || 0),
    invoiceNumber: values.invoiceNumber || undefined,
    currencyCode: values.currencyCode || undefined,
    status: values.status || undefined,
    note: values.note || undefined,
  };
}

function buildFormState(row: Record<string, unknown>) {
  const formState = { ...row };
  if (row.supplier) {
    formState.supplier = {
      label: (row.supplier as { name: string }).name,
      value: row.supplierId,
    };
  }
  if (row.warehouse) {
    formState.warehouse = {
      label: (row.warehouse as { name: string }).name,
      value: row.warehouseId,
    };
  }
  return formState;
}

export const purchasesConfig: ModelConfig = {
  id: 'purchases',
  title: 'Purchases',
  description: 'Record and review purchase orders and goods intake.',
  endpoint: '/purchases',
  columns,
  createFields,
  buildCreatePayload,
  buildFormState,
  view: purchasesView,
  detailPathBuilder: (row) => `/rxsoft/purchases/${String(row.id)}`,
  canDelete: true,
  canExport: true,
  csvEndpoint: '/purchases/export',
};
