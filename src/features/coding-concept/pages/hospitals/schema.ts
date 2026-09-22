import { type Column, ColumnTypeFilters } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

function refName(row: Record<string, unknown>, key: string) {
  const ref = row[key] as { name?: string } | null | undefined;
  return ref?.name ?? '—';
}

const columns: Column[] = [
  { key: 'facilityId', label: 'Code' },
  { key: 'facilityName', label: 'Name', filters: ColumnTypeFilters.STRING },
  { key: 'facilityLevel.name', label: 'Level', render: (row) => refName(row, 'facilityLevel') },
  { key: 'state.name', label: 'State', render: (row) => refName(row, 'state') },
  { key: 'lga.name', label: 'LGA', render: (row) => refName(row, 'lga') },
  { key: 'ward.name', label: 'Ward', render: (row) => refName(row, 'ward') },
  {
    key: 'ownershipTypeCode',
    label: 'Ownership',
    render: (row) => String(row.ownershipTypeCode ?? '—'),
  },
];

export const hospitalsConfig: ModelConfig = {
  id: 'hospitals',
  title: 'Hospitals',
  description: 'Hospital facilities from the national registry.',
  endpoint: '/facilities',
  // Hospitals are the hospital-named subset of the facilities registry.
  listParams: { name_like: 'hospital' },
  columns,
  detailPathBuilder: (row) => `/coding-concept/facilities/hospitals/${row.id}`,
};
