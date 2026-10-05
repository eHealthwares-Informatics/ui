import { createFileRoute } from '@tanstack/react-router';
import { RxWebsiteDeliveryAreasPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/website-delivery-areas/')({
  component: RxWebsiteDeliveryAreasPage,
});
