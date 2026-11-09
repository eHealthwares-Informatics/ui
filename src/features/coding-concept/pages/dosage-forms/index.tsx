import { DataPageShell } from '@/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { dosageFormsConfig } from './schema';

export function CodedDosageFormsPage() {
  return <DataPageShell config={{ ...dosageFormsConfig, apiProvider: codingConceptApi }} />;
}
