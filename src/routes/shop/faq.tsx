import { createFileRoute } from '@tanstack/react-router';
import FaqPage from '@/features/shop/pages/faq';

export const Route = createFileRoute('/shop/faq')({
  component: FaqPage,
});
