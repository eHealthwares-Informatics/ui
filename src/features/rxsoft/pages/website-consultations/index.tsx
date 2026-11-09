import { DataPageShell } from '@/components/page/data-page-shell';
import { consultationsConfig } from './schema';

export function RxWebsiteConsultationsPage() {
  return <DataPageShell config={consultationsConfig} />;
}
