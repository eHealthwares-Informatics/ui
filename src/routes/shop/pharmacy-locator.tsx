import { createFileRoute } from '@tanstack/react-router';
import PharmacyLocatorPage from '@/features/shop/locator/pharmacy-locator';

export const Route = createFileRoute('/shop/pharmacy-locator')({
  component: PharmacyLocatorPage,
});
