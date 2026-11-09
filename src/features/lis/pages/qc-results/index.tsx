import { DataPageShell } from '@/components/page/data-page-shell';
import { qcResultsConfig } from './schema';

export function LisQcResultsPage() {
  return <DataPageShell config={qcResultsConfig} />;
}
