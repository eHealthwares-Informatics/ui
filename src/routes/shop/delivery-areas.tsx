import { createFileRoute } from '@tanstack/react-router';
import DeliveryAreasPage from '@/features/damorex/delivery/page';

export const Route = createFileRoute('/shop/delivery-areas')({
  component: DeliveryAreasPage,
});
