import { DataPageShell } from '@/components/page/data-page-shell';
import { warehousesConfig } from './schema';

export function RxWarehousesPage() {
  return <DataPageShell config={warehousesConfig} />;
}
