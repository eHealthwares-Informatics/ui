import { createFileRoute } from '@tanstack/react-router';
import ContactPage from '@/features/damorex/contact/page';

export const Route = createFileRoute('/shop/contact')({
  component: ContactPage,
});
