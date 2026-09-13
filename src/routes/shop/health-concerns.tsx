import { createFileRoute } from '@tanstack/react-router';
import HealthConcernsPage from '@/features/shop/health-concerns/page';

export const Route = createFileRoute('/shop/health-concerns')({
  component: HealthConcernsPage,
});
