import { DataPageShell } from '@/components/page/data-page-shell';
import { aiProvidersConfig } from './schema';

export function RxAIProvidersPage() {
  return <DataPageShell config={aiProvidersConfig} />;
}

export { aiProvidersConfig } from './schema';
