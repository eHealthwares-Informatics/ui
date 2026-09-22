import { createFileRoute } from '@tanstack/react-router';
import { RxAIModelsPage } from '@/features/rxsoft/pages/conversation';

export const Route = createFileRoute('/_authenticated/conversation/ai/models/')({
  component: RxAIModelsPage,
});
