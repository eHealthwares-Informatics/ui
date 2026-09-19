import { DataPageShell } from '@/features/components/page/data-page-shell';
import { bedsConfig } from '../../registry/beds';

export function BedsListPage() {
  return <DataPageShell config={bedsConfig} />;
}