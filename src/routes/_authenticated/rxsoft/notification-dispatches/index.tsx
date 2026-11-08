import { createFileRoute } from '@tanstack/react-router';
import { RxNotificationDispatchesPage } from '@/features/rxsoft/pages/notification-dispatches';

export const Route = createFileRoute('/_authenticated/rxsoft/notification-dispatches/')({
  component: RxNotificationDispatchesPage,
});
