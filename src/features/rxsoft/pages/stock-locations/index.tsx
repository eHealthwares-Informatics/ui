import { DataPageShell } from '@/components/page/data-page-shell';
import { stockLocationsConfig } from './schema';

export function RxStockLocationPage() {
  return <DataPageShell config={stockLocationsConfig} />;
}
