import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { ModelConfig } from '@/features/shared/model-schema';
import { aiEvalLogPageSchema } from './conversation-page-schemas';

const config: ModelConfig = aiEvalLogPageSchema;

export function RxAIEvalLogsPage() {
  return <DataPageShell config={config} />;
}
