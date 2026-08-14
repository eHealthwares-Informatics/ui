import { DataPageShell } from '@/features/components/page/data-page-shell';
import { qaChecklistItemsConfig } from './schema';

export function LisQaChecklistItemsPage() {
  return <DataPageShell config={qaChecklistItemsConfig} />;
}
