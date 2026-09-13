import { DataPageShell } from '@/features/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { formulationsConfig } from './schema';

export function CodedFormulationsPage() {
  return <DataPageShell config={{ ...formulationsConfig, apiProvider: codingConceptApi }} />;
}
