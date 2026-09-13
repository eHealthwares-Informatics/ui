import { createFileRoute } from '@tanstack/react-router';
import TrackOrderPage from '@/features/shop/orders/track';

export const Route = createFileRoute('/shop/track-order/$code')({
  component: TrackOrderPage,
});
