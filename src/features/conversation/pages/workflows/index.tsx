import { DataPageShell } from '@/components/page/data-page-shell';
import { workflowsConfig } from './schema';

export function RxWorkflowsPage() {
  return <DataPageShell config={workflowsConfig} />;
}

export { workflowsConfig, workflowStepTypeOptions } from './schema';
export { workflowStepsConfig } from './step-schema';
