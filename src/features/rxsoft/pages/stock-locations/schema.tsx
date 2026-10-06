import { Badge } from '@mantine/core';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ModelConfig } from '@/features/shared/model-schema';
import { ColumnDataType } from '../../types';

/** Async-select formState value → id string (or undefined when empty). */
function flattenOptionId(v: unknown): string | undefined {
  if (v && typeof v === 'object' && 'value' in (v as Record<string, unknown>)) {
    const val = (v as Record<string, unknown>).value;
    return val === undefined || val === null || val === '' ? undefined : String(val);
  }
  return typeof v === 'string' && v ? v : undefined;
}

export const stockLocationsConfig: ModelConfig = {
  id: 'stock-locations',
  title: 'Stock Locations',
  description: 'Manage inventory stock locations and warehouse bins.',
  endpoint: '/stock-locations',
  modalTitle: 'Create Stock Location',

  columns: [
    {
      key: 'code',
      label: 'Code',
      dataType: ColumnDataType.STRING,
    },
    {
      key: 'name',
      label: 'Name',
      dataType: ColumnDataType.STRING,
    },
    {
      key: 'warehouseName',
      label: 'Warehouse',
      dataType: ColumnDataType.STRING,
    },
    {
      key: 'parentName',
      label: 'Parent Location',
      dataType: ColumnDataType.STRING,
    },
    {
      key: 'locationType',
      label: 'Location Type',
      dataType: ColumnDataType.STRING,
      render: (row) => {
        const type = row.locationType as string;

        return <Badge variant="secondary">{type?.toUpperCase()}</Badge>;
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      dataType: ColumnDataType.BOOLEAN,
      render: (row) => {
        const active = Boolean(row.isActive);

        return active ? (
          <Badge className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Inactive
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Created At',
      dataType: ColumnDataType.DATE,
      render: (row) => {
        if (!row.createdAt) {
          return '-';
        }

        return new Date(row.createdAt as string).toLocaleString();
      },
    },
  ],

  createFields: [
    {
      name: 'code',
      label: 'Code',
      type: 'text',
      placeholder: 'e.g. BIN-A01',
      col: 6,
    },
    {
      name: 'name',
      label: 'Location Name',
      type: 'text',
      required: true,
      placeholder: 'Enter location name',
      col: 6,
    },
    {
      name: 'parentId',
      label: 'Parent Location',
      type: 'async-select',
      required: true,
      placeholder: 'Select parent location',
      searchParam: {
        endpoint: '/stock-locations',
        queryParam: 'search',
        valueKey: 'id',
        labelKey: 'name',
        minChars: 0,
      },
      col: 6,
    },
    {
      name: 'warehouseId',
      label: 'Warehouse',
      type: 'async-select',
      required: true,
      placeholder: 'Select warehouse',
      searchParam: {
        endpoint: '/warehouses',
        queryParam: 'search',
        valueKey: 'id',
        labelKey: 'name',
        minChars: 0,
      },
      col: 6,
    },
    {
      name: 'locationType',
      label: 'Location Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Internal', value: 'internal' },
        { label: 'Supplier', value: 'supplier' },
        { label: 'Customer', value: 'customer' },
        { label: 'Inventory', value: 'inventory' },
        { label: 'Scrap', value: 'scrap' },
        { label: 'Transit', value: 'transit' },
      ],
      col: 6,
      defaultValue: 'internal',
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'switch',
      defaultValue: true,
      col: 6,
    },
  ],

  defaultState: {
    warehouseId: '',
    parentId: '',
    code: '',
    name: '',
    locationType: 'internal',
    isActive: true,
  },

  // Async-selects store {value,label} option objects in formState — flatten
  // to the id string or the backend rejects with "must be a string".
  buildCreatePayload: (values) => ({
    warehouseId: flattenOptionId(values.warehouseId),
    parentId: flattenOptionId(values.parentId),
    code: values.code || undefined,
    name: values.name,
    locationType: values.locationType,
    isActive: values.isActive,
  }),

  buildUpdatePayload: (values) => ({
    warehouseId: flattenOptionId(values.warehouseId),
    parentId: flattenOptionId(values.parentId),
    code: values.code || undefined,
    name: values.name,
    locationType: values.locationType,
    isActive: values.isActive,
  }),

  canDelete: true,
  canExport: true,
  csvEndpoint: '/stock-locations/export',

  detailPathBuilder: (row) => `/inventory/stock-locations/${row.id}`,

  editPathBuilder: (row) => `/inventory/stock-locations/${row.id}/edit`,

  deletePathBuilder: (row) => `/stock-locations/${row.id}`,
};
