import { createFileRoute } from '@tanstack/react-router';
import { RxAIProcessorsPage } from '@/features/rxsoft/pages/conversation';

export const Route = createFileRoute('/_authenticated/conversation/ai/processors/')({
  component: RxAIProcessorsPage,
});
