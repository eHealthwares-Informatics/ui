import { DataPageShell } from '@/components/page/data-page-shell';
import { purchasesConfig } from './schema';

export function RxPurchasesPage() {
  return <DataPageShell config={purchasesConfig} />;
}
