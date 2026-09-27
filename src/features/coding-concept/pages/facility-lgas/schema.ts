import type { Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'stateCode', label: 'State Code' },
];

export const facilityLgasConfig: ModelConfig = {
  id: 'facility-lgas',
  title: 'LGAs',
  description: 'View LGA reference data.',
  endpoint: '/facilities/lgas',
  columns,
};
