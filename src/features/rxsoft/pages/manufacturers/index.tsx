import { DataPageShell } from '@/components/page/data-page-shell';
import { manufacturersConfig } from './schema';

export function RxManufacturersPage() {
  return <DataPageShell config={manufacturersConfig} />;
}
