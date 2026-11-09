import { createFileRoute } from '@tanstack/react-router';
import { RxNotificationEventsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/notification-events/')({
  component: RxNotificationEventsPage,
});
