import { DataPageShell } from '@/components/page/data-page-shell';
import { panelsConfig } from './schema';

export function LisPanelsPage() {
  return <DataPageShell config={panelsConfig} />;
}
