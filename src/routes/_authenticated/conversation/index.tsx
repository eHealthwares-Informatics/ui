import { createFileRoute } from '@tanstack/react-router';
import { RxConversationsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/')({
  component: RxConversationsPage,
});
