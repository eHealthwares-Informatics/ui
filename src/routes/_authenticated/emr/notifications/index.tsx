import { createFileRoute } from '@tanstack/react-router';
import { EmrNotificationDispatchesPage } from '@/features/emr/pages/notification-dispatches-page';

export const Route = createFileRoute('/_authenticated/emr/notifications/')({
  component: EmrNotificationDispatchesPage,
});
