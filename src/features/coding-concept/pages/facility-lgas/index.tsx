import { DataPageShell } from '@/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { facilityLgasConfig } from './schema';

export function CodedFacilityLgasPage() {
  return <DataPageShell config={{ ...facilityLgasConfig, apiProvider: codingConceptApi }} />;
}
