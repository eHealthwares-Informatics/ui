import { DataPageShell } from '@/features/components/page/data-page-shell';
import { bedsConfig } from './schema';

export function BedsListPage() {
  return <DataPageShell config={bedsConfig} />;
}
