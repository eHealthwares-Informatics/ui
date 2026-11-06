import { createFileRoute } from '@tanstack/react-router';
import { RxNotificationTemplatesPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/conversation/notification-templates/')({
  component: RxNotificationTemplatesPage,
});
