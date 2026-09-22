import { DataPageShell } from '@/features/components/page/data-page-shell';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { hospitalsConfig } from './schema';

export { CodedHospitalDetailPage } from './detail';

export function CodedHospitalsPage() {
  return <DataPageShell config={{ ...hospitalsConfig, apiProvider: codingConceptApi }} />;
}
