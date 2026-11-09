import { DataPageShell } from '@/components/page/data-page-shell';
import { qcAlertsConfig } from './schema';

export function LisQcAlertsPage() {
  return <DataPageShell config={qcAlertsConfig} />;
}
