import { DataPageShell } from '@/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { facilityStatesConfig } from './schema';

export function CodedFacilityStatesPage() {
  return <DataPageShell config={{ ...facilityStatesConfig, apiProvider: codingConceptApi }} />;
}
