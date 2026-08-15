import { DataPageShell } from '@/features/components/page/data-page-shell';
import { ehealthwaresProductsConfig } from './schema';

export function EhealthwaresProductsPage() {
  return <DataPageShell config={ehealthwaresProductsConfig} />;
}
