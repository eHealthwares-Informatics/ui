import { createFileRoute } from '@tanstack/react-router';
import TermsPage from '@/features/shop/pages/terms';

export const Route = createFileRoute('/shop/terms')({
  component: TermsPage,
});
