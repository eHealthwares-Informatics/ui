import { DataPageShell } from '@/features/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { laboratoriesConfig } from './schema';

export { CodedLaboratoryDetailPage } from './detail';

export function CodedLaboratoriesPage() {
  return <DataPageShell config={{ ...laboratoriesConfig, apiProvider: codingConceptApi }} />;
}
