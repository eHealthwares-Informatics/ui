import { DataPageShell } from '@/components/page/data-page-shell';
import { aiInstructionsConfig } from './schema';

export function RxAIInstructionsPage() {
  return <DataPageShell config={aiInstructionsConfig} />;
}

export { aiInstructionsConfig } from './schema';
