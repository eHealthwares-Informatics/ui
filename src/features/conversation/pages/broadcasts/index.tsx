import { DataPageShell } from '@/components/page/data-page-shell';
import { broadcastsConfig } from './schema';

export function RxBroadcastsPage() {
  return <DataPageShell config={broadcastsConfig} />;
}

export { broadcastsConfig } from './schema';
