import { DataPageShell } from '@/components/page/data-page-shell';
import { priceListsConfig } from './schema';

export function RxPriceListsPage() {
  return <DataPageShell config={priceListsConfig} />;
}
