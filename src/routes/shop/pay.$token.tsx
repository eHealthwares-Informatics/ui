import { createFileRoute } from '@tanstack/react-router';
import PayPage from '@/features/damorex/pay/page';

export const Route = createFileRoute('/shop/pay/$token')({
  component: PayPage,
});