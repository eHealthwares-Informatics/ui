import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { ModelConfig } from '@/features/shared/model-schema';
import { aiProcessorPageSchema } from './conversation-page-schemas';

const config: ModelConfig = aiProcessorPageSchema;

export function RxAIProcessorsPage() {
  return <DataPageShell config={config} />;
}
