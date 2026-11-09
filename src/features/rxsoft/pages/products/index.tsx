import { DataPageShell } from '@/components/page/data-page-shell';
import { itemsConfig } from './types/schema';

export function RxItemsPage() {
  return <DataPageShell config={itemsConfig} />;
}

export * from './components/detail';
