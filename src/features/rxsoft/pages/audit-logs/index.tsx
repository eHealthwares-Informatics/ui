import { DataPageShell } from '@/components/page/data-page-shell';
import { auditLogsConfig } from './schema';

export function RxAuditLogsPage() {
  return <DataPageShell config={auditLogsConfig} />;
}
