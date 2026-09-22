import { createFileRoute } from '@tanstack/react-router';
import { RxAICostsPage } from '@/features/rxsoft/pages/conversation';

export const Route = createFileRoute('/_authenticated/conversation/ai/costs/')({
  component: RxAICostsPage,
});
