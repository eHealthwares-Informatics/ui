import { DataPageShell } from '@/components/page/data-page-shell';
import { channelsConfig } from './schema';

export function RxChannelsPage() {
  return <DataPageShell config={channelsConfig} />;
}

export { channelsConfig } from './schema';
