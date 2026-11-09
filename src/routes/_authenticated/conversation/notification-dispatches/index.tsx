import { createFileRoute } from '@tanstack/react-router';
import { RxNotificationDispatchesPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/notification-dispatches/')({
  component: RxNotificationDispatchesPage,
});
