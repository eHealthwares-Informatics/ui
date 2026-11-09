import { DataPageShell } from '@/components/page/data-page-shell';
import { aiEvalLogsConfig } from './schema';

export function RxAIEvalLogsPage() {
  return <DataPageShell config={aiEvalLogsConfig} />;
}

export { aiEvalLogsConfig } from './schema';
