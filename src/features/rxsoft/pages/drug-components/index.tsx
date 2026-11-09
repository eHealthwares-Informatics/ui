import { DataPageShell } from '@/components/page/data-page-shell';
import { drugComponentsConfig } from './schema';

export function RxDrugComponentsPage() {
  return <DataPageShell config={drugComponentsConfig} />;
}
