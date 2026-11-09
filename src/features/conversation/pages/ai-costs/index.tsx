import { DataPageShell } from '@/components/page/data-page-shell';
import { aiCostsConfig } from './schema';

export function RxAICostsPage() {
  return <DataPageShell config={aiCostsConfig} />;
}

export { aiCostsConfig } from './schema';
