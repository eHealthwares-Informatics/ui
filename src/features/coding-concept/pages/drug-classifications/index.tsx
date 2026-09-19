import { DataPageShell } from '@/features/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { drugClassificationsConfig } from './schema';

export function CodedDrugClassificationsPage() {
  return <DataPageShell config={{ ...drugClassificationsConfig, apiProvider: codingConceptApi }} />;
}
