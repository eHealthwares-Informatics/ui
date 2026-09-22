import { type Column, ColumnTypeFilters } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

function refName(row: Record<string, unknown>, key: string) {
  const ref = row[key] as { name?: string } | null | undefined;
  return ref?.name ?? '—';
}

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name', filters: ColumnTypeFilters.STRING },
  { key: 'address', label: 'Address', render: (row) => String(row.address ?? '—') },
  { key: 'rating', label: 'Rating', render: (row) => String(row.rating ?? '—') },
  { key: 'state.name', label: 'State', render: (row) => refName(row, 'state') },
  { key: 'lga.name', label: 'LGA', render: (row) => refName(row, 'lga') },
  { key: 'openHours', label: 'Open hours', render: (row) => String(row.openHours ?? '—') },
];

export const laboratoriesConfig: ModelConfig = {
  id: 'laboratories',
  title: 'Laboratories',
  description: 'Diagnostic and medical laboratory directory.',
  endpoint: '/diagnostic-centers',
  columns,
  detailPathBuilder: (row) => `/coding-concept/facilities/laboratories/${row.id}`,
};
