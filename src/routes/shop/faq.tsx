import { createFileRoute } from '@tanstack/react-router';
import FaqPage from '@/features/damorex/pages/faq';

export const Route = createFileRoute('/shop/faq')({
  component: FaqPage,
});
