import { DataPageShell } from '@/components/page/data-page-shell';
import { programsConfig } from './schema';

export function LisProgramsPage() {
  return <DataPageShell config={programsConfig} />;
}
