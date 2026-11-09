import { DataPageShell } from '@/components/page/data-page-shell';
import { workflowInstancesConfig } from './schema';

export function RxWorkflowInstancesPage() {
  return <DataPageShell config={workflowInstancesConfig} />;
}

export { workflowInstancesConfig } from './schema';
