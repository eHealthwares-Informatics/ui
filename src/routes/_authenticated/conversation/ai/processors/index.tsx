import { createFileRoute } from '@tanstack/react-router';
import { RxAIProcessorsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/ai/processors/')({
  component: RxAIProcessorsPage,
});
