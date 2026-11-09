import { DataPageShell } from '@/components/page/data-page-shell';
import { statusesConfig } from './schema';

export function LisStatusesPage() {
  return <DataPageShell config={statusesConfig} />;
}
