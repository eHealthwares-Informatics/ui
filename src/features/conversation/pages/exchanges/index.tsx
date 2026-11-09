import { DataPageShell } from '@/components/page/data-page-shell';
import { exchangesConfig } from './schema';

export function RxExchangesPage() {
  return <DataPageShell config={exchangesConfig} />;
}

export { RxExchangeDetailsPage } from './detail';
export { exchangesConfig } from './schema';
