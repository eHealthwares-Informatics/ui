import { DataPageShell } from '@/components/page/data-page-shell';
import { suppliersConfig } from './schema';

export function RxSuppliersPage() {
  return <DataPageShell config={suppliersConfig} />;
}
