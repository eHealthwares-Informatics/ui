import type { ModelConfig } from '../../../shared/model-schema';
import { ColumnDataType, ColumnTypeFilters, type Column } from '../../types';

const saleColumns: Column[] = [
  { key: 'saleNumber', label: 'Sale', filters: ColumnTypeFilters.STRING },
  { key: 'itemName', label: 'Item', filters: ColumnTypeFilters.STRING },
  { key: 'lineNumber', label: 'Line' },
  { key: 'quantity', label: 'Qty', dataType: ColumnDataType.NUMBER, filters: ColumnTypeFilters.NUMBER },
  { key: 'uomName', label: 'UOM' },
  { key: 'unitPrice', label: 'Unit Price', dataType: ColumnDataType.NUMBER },
  { key: 'discountPercent', label: 'Disc %' },
  { key: 'taxPercent', label: 'Tax %' },
  { key: 'lineSubtotal', label: 'Subtotal', dataType: ColumnDataType.NUMBER },
  { key: 'lineTotal', label: 'Total', dataType: ColumnDataType.NUMBER },
];

export function buildSalesLinesConfig(saleId: string | null): ModelConfig {
  return {
    id: 'sales-lines',
    title: 'Sales Lines',
    description: 'Line-level detail for posted sales.',
    endpoint: '/sales/lines',
    columns: saleColumns,
    listParams: saleId ? { saleId } : {},
  };
}