import { DataPageShell } from '@/components/page/data-page-shell';
import { workflowEventsConfig } from './schema';

export function RxWorkflowEventsPage() {
  return <DataPageShell config={workflowEventsConfig} />;
}

export { workflowEventsConfig } from './schema';
