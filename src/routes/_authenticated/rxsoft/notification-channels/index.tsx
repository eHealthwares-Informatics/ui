import { createFileRoute } from '@tanstack/react-router';
import { RxNotificationChannelsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/notification-channels/')({
  component: RxNotificationChannelsPage,
});
