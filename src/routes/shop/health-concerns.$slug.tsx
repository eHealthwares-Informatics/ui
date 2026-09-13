import { createFileRoute } from '@tanstack/react-router';
import HealthConcernDetailPage from '@/features/shop/health-concerns/detail';

export const Route = createFileRoute('/shop/health-concerns/$slug')({
  component: HealthConcernDetailPage,
});
