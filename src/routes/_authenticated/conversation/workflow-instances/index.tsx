import { createFileRoute } from '@tanstack/react-router';
import { RxWorkflowInstancesPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/workflow-instances/')({
  component: RxWorkflowInstancesPage,
});
