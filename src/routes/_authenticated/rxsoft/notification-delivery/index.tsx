import { createFileRoute } from '@tanstack/react-router';
import { RxNotificationDeliveryPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/notification-delivery/')({
  component: RxNotificationDeliveryPage,
});
