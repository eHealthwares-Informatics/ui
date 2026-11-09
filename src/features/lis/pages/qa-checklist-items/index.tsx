import { DataPageShell } from '@/components/page/data-page-shell';
import { qaChecklistItemsConfig } from './schema';

export function LisQaChecklistItemsPage() {
  return <DataPageShell config={qaChecklistItemsConfig} />;
}
