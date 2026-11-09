import { createFileRoute } from '@tanstack/react-router';
import { RxAIEvalLogsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/ai/eval-logs/')({
  component: RxAIEvalLogsPage,
});
