import { DataPageShell } from '@/components/page/data-page-shell';
import { customersConfig } from './schema';

export function RxCustomersPage() {
  return <DataPageShell config={customersConfig} />;
}
