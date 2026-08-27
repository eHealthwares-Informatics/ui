import { ColumnDataType, EQUALS_WITH_OPTIONS, ColumnTypeFilters, RELATION_FILTER, type Column, type Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { UserPopover } from '../../../components/popover/user-popover';

const movementTypeOptions: Option[] = [
  { value: 'in', label: 'In' },
  { value: 'out', label: 'Out' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'adjustment', label: 'Adjustment' },
];

const stockBalancesColumns: Column[] = [
  {
    key: 'item',
    label: 'Item',
    render: (row) => (row as any).item?.name ?? (row as any).itemId ?? '-',
    filters: RELATION_FILTER({ endpoint: '/items', queryParam: 'search', valueKey: 'id', labelKey: 'name', minChars: 2 }),
  },
  {
    key: 'location',
    label: 'Location',
    render: (row) => (row as any).location?.name ?? (row as any).locationId ?? '-',
    filters: RELATION_FILTER({ endpoint: '/stock-locations', queryParam: 'search', valueKey: 'id', labelKey: 'name', minChars: 0 }),
  },
  { key: 'quantityOnHand', label: 'On Hand', dataType: ColumnDataType.NUMBER, filters: ColumnTypeFilters.NUMBER },
  { key: 'quantityReserved', label: 'Reserved', dataType: ColumnDataType.NUMBER, filters: ColumnTypeFilters.NUMBER },
  {
    key: 'available',
    label: 'Available',
    dataType: ColumnDataType.NUMBER,
    filters: ColumnTypeFilters.NUMBER,
    render: (row) => {
      const available = Number((row as any).quantityOnHand ?? 0) - Number((row as any).quantityReserved ?? 0);
      return String(available);
    },
  },
];

const stockMovementsColumns: Column[] = [
  { key: 'id', label: 'ID' },
  {
    key: 'item',
    label: 'Item',
    render: (row) => (row as any).item?.name ?? (row as any).itemId ?? '-',
  },
  {
    key: 'location',
    label: 'Location',
    render: (row) => {
      const from = (row as any).fromLocation?.name ?? (row as any).fromLocationId;
      const to = (row as any).toLocation?.name ?? (row as any).toLocationId;
      if (from && to) {return `${from} → ${to}`;}
      return from ?? to ?? '-';
    },
  },
  {
    key: 'movementType',
    label: 'Type',
    filters: EQUALS_WITH_OPTIONS(movementTypeOptions),
  },
  { key: 'quantity', label: 'Quantity' },
  {
    key: 'createdByUserId',
    label: 'User',
    render: (row) => <UserPopover userId={(row as any).createdByUserId} fallback="-" />,
  },
  {
    key: 'occurredAt',
    label: 'Date',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
  },
  { key: 'createdAt', label: 'Created' },
];

export const stockBalancesConfig: ModelConfig = {
  id: 'stock-balances',
  title: 'Stock Balances',
  description: 'Inventory stock balances with pagination and filters.',
  endpoint: '/inventory/stock-balances',
  columns: stockBalancesColumns,
  canExport: true,
  csvEndpoint: '/inventory/stock-balances/export',
};

export const stockMovementsConfig: ModelConfig = {
  id: 'stock-movements',
  title: 'Stock Movements',
  description: 'Inventory movement log.',
  endpoint: '/inventory/stock-movements',
  columns: stockMovementsColumns,
  canExport: true,
  csvEndpoint: '/inventory/stock-movements/export',
};
