import { DataPageShell } from '@/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { codedPharmaceuticsConfig } from './schema';

export function CodedPharmaceuticsPage() {
  return <DataPageShell config={{ ...codedPharmaceuticsConfig, apiProvider: codingConceptApi }} />;
}
