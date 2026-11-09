import { DataPageShell } from '@/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { facilityWardsConfig } from './schema';

export function CodedFacilityWardsPage() {
  return <DataPageShell config={{ ...facilityWardsConfig, apiProvider: codingConceptApi }} />;
}
