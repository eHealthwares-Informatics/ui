import { createFileRoute } from '@tanstack/react-router';
import { RxNotificationDeliveryPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/notification-delivery/')({
  component: RxNotificationDeliveryPage,
});
