import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { ModelConfig } from '@/features/shared/model-schema';
import { aiCostPageSchema } from './conversation-page-schemas';

const config: ModelConfig = aiCostPageSchema;

export function RxAICostsPage() {
  return <DataPageShell config={config} />;
}
