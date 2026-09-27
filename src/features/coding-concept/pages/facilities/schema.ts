import type { Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'facilityId', label: 'Code' },
  { key: 'facilityName', label: 'Name' },
  { key: 'facilityType.name', label: 'Type' },
  { key: 'facilityLevel.name', label: 'Level' },
  { key: 'lga.name', label: 'LGA' },
  { key: 'ward.name', label: 'Ward' },
  { key: 'state.name', label: 'State' },
];

export const facilitiesConfig: ModelConfig = {
  id: 'facilities',
  title: 'Facilities',
  description: 'View healthcare facility reference data.',
  endpoint: '/facilities',
  columns,
};
