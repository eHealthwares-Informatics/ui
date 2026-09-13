import { DataPageShell } from '@/features/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { manufacturersConfig } from './schema';

export function CodedManufacturersPage() {
  return <DataPageShell config={{ ...manufacturersConfig, apiProvider: codingConceptApi }} />;
}
