import { createFileRoute } from '@tanstack/react-router';
import AboutPage from '@/features/shop/pages/about';

export const Route = createFileRoute('/shop/about')({
  component: AboutPage,
});
