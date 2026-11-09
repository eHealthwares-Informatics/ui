import { DataPageShell } from '@/components/page/data-page-shell';
import { conversationsConfig } from './schema';

export function RxConversationsPage() {
  return <DataPageShell config={conversationsConfig} />;
}

export { RxConversationDetailsPage } from './detail';
export { conversationsConfig } from './schema';
