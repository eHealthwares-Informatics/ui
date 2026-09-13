import { createFileRoute } from '@tanstack/react-router';
import DeliveryAreasPage from '@/features/shop/delivery/page';

export const Route = createFileRoute('/shop/delivery-areas')({
  component: DeliveryAreasPage,
});
