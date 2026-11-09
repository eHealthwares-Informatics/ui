import { createFileRoute } from '@tanstack/react-router';
import { RxAIModelsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/ai/models/')({
  component: RxAIModelsPage,
});
