import type { Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
];

export const facilityStatesConfig: ModelConfig = {
  id: 'facility-states',
  title: 'States',
  description: 'View state reference data.',
  endpoint: '/facilities/states',
  columns,
};
