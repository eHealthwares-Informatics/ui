import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { ModelConfig } from '@/features/shared/model-schema';
import { broadcastPageSchema } from './conversation-page-schemas';

const config: ModelConfig = broadcastPageSchema;

export function RxBroadcastsPage() {
  return <DataPageShell config={config} />;
}
