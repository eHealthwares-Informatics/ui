import { createFileRoute } from '@tanstack/react-router';
import { RxAIProvidersPage } from '@/features/rxsoft/pages/conversation';

export const Route = createFileRoute('/_authenticated/conversation/ai/providers/')({
  component: RxAIProvidersPage,
});
