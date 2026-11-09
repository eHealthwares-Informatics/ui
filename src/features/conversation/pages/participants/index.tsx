import { DataPageShell } from '@/components/page/data-page-shell';
import { participantsConfig } from './schema';

export function RxParticipantsPage() {
  return <DataPageShell config={participantsConfig} />;
}

export { participantsConfig } from './schema';
