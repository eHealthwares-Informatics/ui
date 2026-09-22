import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { ModelConfig } from '@/features/shared/model-schema';
import { aiRequestLogPageSchema } from './conversation-page-schemas';

const config: ModelConfig = aiRequestLogPageSchema;

export function RxAIRequestLogsPage() {
  return <DataPageShell config={config} />;
}
