import { createFileRoute } from '@tanstack/react-router';
import AboutPage from '@/features/damorex/pages/about';

export const Route = createFileRoute('/shop/about')({
  component: AboutPage,
});
