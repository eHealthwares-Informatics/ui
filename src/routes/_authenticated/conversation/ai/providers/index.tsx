import { createFileRoute } from '@tanstack/react-router';
import { RxAIProvidersPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/ai/providers/')({
  component: RxAIProvidersPage,
});
