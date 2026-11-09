import { createFileRoute } from '@tanstack/react-router';
import { RxBroadcastsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/broadcasts')({
  component: RxBroadcastsPage,
});
