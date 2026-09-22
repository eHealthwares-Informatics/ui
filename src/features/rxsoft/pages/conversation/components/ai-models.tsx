import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { ModelConfig } from '@/features/shared/model-schema';
import { aiModelPageSchema } from './conversation-page-schemas';

const config: ModelConfig = aiModelPageSchema;

export function RxAIModelsPage() {
  return <DataPageShell config={config} />;
}
