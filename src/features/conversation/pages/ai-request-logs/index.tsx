import { DataPageShell } from '@/components/page/data-page-shell';
import { aiRequestLogsConfig } from './schema';

export function RxAIRequestLogsPage() {
  return <DataPageShell config={aiRequestLogsConfig} />;
}

export { aiRequestLogsConfig } from './schema';
