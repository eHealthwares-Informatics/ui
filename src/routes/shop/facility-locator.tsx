import { createFileRoute } from '@tanstack/react-router';
import FacilityLocatorPage from '@/features/shop/locator/facility-locator';

export const Route = createFileRoute('/shop/facility-locator')({
  component: FacilityLocatorPage,
});
