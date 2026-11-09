import { DataPageShell } from '@/components/page/data-page-shell';
import { glAccountsConfig } from './schema';

export function RxGlAccountsPage() {
  return <DataPageShell config={glAccountsConfig} />;
}
