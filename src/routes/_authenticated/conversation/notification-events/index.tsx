import { createFileRoute } from '@tanstack/react-router';
import { RxNotificationEventsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/conversation/notification-events/')({
  component: RxNotificationEventsPage,
});
