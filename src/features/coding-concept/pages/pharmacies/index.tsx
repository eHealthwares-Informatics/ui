import { DataPageShell } from '@/features/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { pharmaciesConfig } from './schema';

export { CodedPharmacyDetailPage } from './detail';

export function CodedPharmaciesPage() {
  return <DataPageShell config={{ ...pharmaciesConfig, apiProvider: codingConceptApi }} />;
}
