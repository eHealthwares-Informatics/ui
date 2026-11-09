import { DataPageShell } from '@/components/page/data-page-shell';
import { workflowAttachmentsConfig } from './schema';

export function RxWorkflowConfigurationPage() {
  return <DataPageShell config={workflowAttachmentsConfig} />;
}

export { workflowAttachmentsConfig } from './schema';
