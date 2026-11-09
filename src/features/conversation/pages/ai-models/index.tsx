import { DataPageShell } from '@/components/page/data-page-shell';
import { aiModelsConfig } from './schema';

export function RxAIModelsPage() {
  return <DataPageShell config={aiModelsConfig} />;
}

export { aiModelsConfig } from './schema';
