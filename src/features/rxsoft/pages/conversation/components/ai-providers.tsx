import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { ModelConfig } from '@/features/shared/model-schema';
import { aiProviderPageSchema } from './conversation-page-schemas';

const config: ModelConfig = aiProviderPageSchema;

export function RxAIProvidersPage() {
  return <DataPageShell config={config} />;
}
