import { createFileRoute } from '@tanstack/react-router';
import { RxWorkflowsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/workflows/')({
  component: RxWorkflowsPage,
});
