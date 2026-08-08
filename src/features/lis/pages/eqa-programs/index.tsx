import { DataPageShell } from '@/features/components/page/data-page-shell';
import { eqaProgramsConfig } from './schema';

export function LisEqaProgramsPage() {
  return <DataPageShell config={eqaProgramsConfig} />;
}