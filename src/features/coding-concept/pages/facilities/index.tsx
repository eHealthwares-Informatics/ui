import { DataPageShell } from '@/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { facilitiesConfig } from './schema';

export function CodedFacilitiesPage() {
  return <DataPageShell config={{ ...facilitiesConfig, apiProvider: codingConceptApi }} />;
}
