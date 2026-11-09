import { DataPageShell } from '@/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { genericDrugsConfig } from './schema';

export function CodedGenericDrugsPage() {
  return <DataPageShell config={{ ...genericDrugsConfig, apiProvider: codingConceptApi }} />;
}
