import { createFileRoute } from '@tanstack/react-router';
import { RxWorkflowEventsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/workflow-events/')({
  component: RxWorkflowEventsPage,
});
