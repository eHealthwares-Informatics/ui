import { createFileRoute } from '@tanstack/react-router';
import RewardsPage from '@/features/shop/rewards/page';

export const Route = createFileRoute('/shop/rewards')({
  component: RewardsPage,
});
