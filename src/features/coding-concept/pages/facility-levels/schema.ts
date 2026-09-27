import type { Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
];

export const facilityLevelsConfig: ModelConfig = {
  id: 'facility-levels',
  title: 'Facility Levels',
  description: 'View facility level reference data.',
  endpoint: '/facilities/levels',
  columns,
};
