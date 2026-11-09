import { DataPageShell } from '@/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { facilityTypesConfig } from './schema';

export function CodedFacilityTypesPage() {
  return <DataPageShell config={{ ...facilityTypesConfig, apiProvider: codingConceptApi }} />;
}
