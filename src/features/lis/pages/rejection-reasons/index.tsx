import { DataPageShell } from '@/components/page/data-page-shell';
import { rejectionReasonsConfig } from './schema';

export function LisRejectionReasonsPage() {
  return <DataPageShell config={rejectionReasonsConfig} />;
}
