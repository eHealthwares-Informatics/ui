import { createFileRoute } from '@tanstack/react-router';
import { RxNotificationDetailPage } from '@/features/conversation';

export const Route = createFileRoute(
  '/_authenticated/conversation/notification-detail/$resource/$id'
)({
  component: NotificationDetailRoute,
});

function NotificationDetailRoute() {
  const { resource, id } = Route.useParams();
  return <RxNotificationDetailPage resource={resource} id={id} />;
}
