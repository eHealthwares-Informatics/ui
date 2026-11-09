import { DataPageShell } from '@/components/page/data-page-shell';
import { eqaProgramsConfig } from './schema';

export function LisEqaProgramsPage() {
  return <DataPageShell config={eqaProgramsConfig} />;
}
