import { createFileRoute } from '@tanstack/react-router';
import { RxAIRequestLogsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/ai/request-logs/')({
  component: RxAIRequestLogsPage,
});
