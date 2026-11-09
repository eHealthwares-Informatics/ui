import { createFileRoute } from '@tanstack/react-router';
import { RxsoftNotificationDispatchesPage } from '@/features/rxsoft';

export const Route = createFileRoute('/_authenticated/rxsoft/notification-dispatches/')({
  component: RxsoftNotificationDispatchesPage,
});
