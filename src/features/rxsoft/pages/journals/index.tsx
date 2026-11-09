import { DataPageShell } from '@/components/page/data-page-shell';
import { journalsConfig } from './schema';

export function RxJournalsPage() {
  return <DataPageShell config={journalsConfig} />;
}
