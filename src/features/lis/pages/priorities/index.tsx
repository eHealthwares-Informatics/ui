import { DataPageShell } from '@/components/page/data-page-shell';
import { prioritiesConfig } from './schema';

export function LisPrioritiesPage() {
  return <DataPageShell config={prioritiesConfig} />;
}
