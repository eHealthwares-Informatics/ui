import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { ModelConfig } from '@/features/shared/model-schema';
import { optionListsPageSchema } from './conversation-page-schemas';

const config: ModelConfig = optionListsPageSchema;

export function RxOptionListsPage() {
  return <DataPageShell config={config} />;
}
