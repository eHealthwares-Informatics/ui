import { DataPageShell } from '@/features/components/page/data-page-shell';
import { eqaResultsConfig } from './schema';

export function LisEqaResultsPage() {
  return <DataPageShell config={eqaResultsConfig} />;
}