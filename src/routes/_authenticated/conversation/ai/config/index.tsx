import { createFileRoute } from '@tanstack/react-router';
import { RxAIConfigPage } from '@/features/rxsoft/pages/conversation';

export const Route = createFileRoute('/_authenticated/conversation/ai/config/')({
  component: RxAIConfigPage,
});
