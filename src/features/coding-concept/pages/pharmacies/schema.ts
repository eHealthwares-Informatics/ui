import type { ModelConfig } from '@/features/shared/model-schema';
import { ColumnDataType, ColumnTypeFilters, type Column } from '@/features/rxsoft/types';

function matchLabel(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) {
    return '—';
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function refName(row: Record<string, unknown>, refKey: string, fallbackKey: string) {
  const ref = row[refKey] as { name?: string } | null | undefined;
  if (ref?.name) {
    return ref.name;
  }
  const fallback = row[fallbackKey];
  return typeof fallback === 'string' && fallback ? fallback : '—';
}

// Locality filters use the backend join aliases (`area.name`, `neighbourhood.name`,
// `settlement.name`); display reads the nested `*Locality` relation objects.
const columns: Column[] = [
  { key: 'premisesId', label: 'Code' },
  { key: 'premisesName', label: 'Name', filters: ColumnTypeFilters.STRING },
  { key: 'pharmacist', label: 'Pharmacist', filters: ColumnTypeFilters.STRING },
  { key: 'category', label: 'Category', filters: ColumnTypeFilters.STRING },
  { key: 'state.name', label: 'State', filters: ColumnTypeFilters.STRING },
  { key: 'lga.name', label: 'LGA' },
  { key: 'ward.name', label: 'Ward' },
  {
    key: 'area.name',
    label: 'Area',
    filters: ColumnTypeFilters.STRING,
    render: (row) => refName(row, 'areaLocality', 'area'),
  },
  {
    key: 'neighbourhood.name',
    label: 'Neighbourhood',
    render: (row) => refName(row, 'neighbourhoodLocality', 'neighbourhood'),
  },
  {
    key: 'settlement.name',
    label: 'Settlement',
    render: (row) => refName(row, 'settlementLocality', 'settlement'),
  },
  { key: 'wardMatch', label: 'Ward Match', render: (row) => matchLabel(row.wardMatch) },
  {
    key: 'yearLicenced',
    label: 'Year',
    dataType: ColumnDataType.NUMBER,
    filters: ColumnTypeFilters.NUMBER,
  },
];

export const pharmaciesConfig: ModelConfig = {
  id: 'pharmacies',
  title: 'Pharmacies',
  description: 'View pharmacy premises reference data.',
  endpoint: '/pharmacies',
  columns,
  detailPathBuilder: (row) => `/coding-concept/facilities/pharmacies/${row.id}`,
};
