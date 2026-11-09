import { DataPageShell } from '@/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { codedDrugComponentsConfig } from './schema';

export function CodedDrugComponentsPage() {
  return <DataPageShell config={{ ...codedDrugComponentsConfig, apiProvider: codingConceptApi }} />;
}
