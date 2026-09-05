import { createFileRoute } from '@tanstack/react-router';
import RewardsPage from '@/features/damorex/rewards/page';

export const Route = createFileRoute('/shop/rewards')({
  component: RewardsPage,
});
