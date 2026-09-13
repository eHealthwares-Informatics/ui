import { createFileRoute } from '@tanstack/react-router';
import PayReturnPage from '@/features/shop/pay/return';

export const Route = createFileRoute('/shop/pay/return')({
  component: PayReturnPage,
});
