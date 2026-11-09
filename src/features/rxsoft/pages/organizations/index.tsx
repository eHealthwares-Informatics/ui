import { DataPageShell } from '@/components/page/data-page-shell';
import { organizationsConfig } from './schema';

export function RxOrganizationsPage() {
  return <DataPageShell config={organizationsConfig} />;
}
