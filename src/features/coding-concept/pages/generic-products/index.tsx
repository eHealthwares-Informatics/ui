import { DataPageShell } from '@/features/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { genericProductsConfig } from './schema';

export function CodedGenericProductsPage() {
  return <DataPageShell config={{ ...genericProductsConfig, apiProvider: codingConceptApi }} />;
}