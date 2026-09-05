import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { ModelConfig } from '@/features/shared/model-schema';
import { invitePageSchema } from './conversation-page-schemas';

const config: ModelConfig = invitePageSchema;

export function RxInvitesPage() {
  return <DataPageShell config={config} />;
}
