import { Badge } from '@mantine/core';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ModelConfig } from '@/features/shared/model-schema';
import { ColumnDataType } from '../../types';

export const warehousesConfig: ModelConfig = {
  id: 'warehouses',
  title: 'Warehouses',
  description: 'Manage warehouse locations.',
  endpoint: '/warehouses',
  modalTitle: 'Create Warehouse',

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
      key: 'address',
      label: 'Address',
      dataType: ColumnDataType.STRING,
      render: (row) => (row.address as string) || '-',
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
      placeholder: 'e.g. WH-001',
      col: 6,
    },
    {
      name: 'name',
      label: 'Warehouse Name',
      type: 'text',
      required: true,
      placeholder: 'Enter warehouse name',
      col: 6,
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Enter warehouse address',
      col: 12,
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
    code: '',
    name: '',
    address: '',
    isActive: true,
  },

  buildCreatePayload: (values) => ({
    code: values.code || undefined,
    name: values.name,
    address: values.address || undefined,
    isActive: values.isActive,
  }),

  buildUpdatePayload: (values) => ({
    code: values.code || undefined,
    name: values.name,
    address: values.address || undefined,
    isActive: values.isActive,
  }),

  canDelete: true,
  canExport: true,
  csvEndpoint: '/warehouses/export',

  detailPathBuilder: (row) => `/inventory/warehouses/${row.id}`,
  editPathBuilder: (row) => `/inventory/warehouses/${row.id}/edit`,
  deletePathBuilder: (row) => `/warehouses/${row.id}`,
};
