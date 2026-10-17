import { createFileRoute } from '@tanstack/react-router';
import { RxWebsiteOrderDetailPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/website-orders/$orderId')({
  component: WebsiteOrderDetailRoute,
});

function WebsiteOrderDetailRoute() {
  const { orderId } = Route.useParams();
  return <RxWebsiteOrderDetailPage orderId={orderId} />;
}
