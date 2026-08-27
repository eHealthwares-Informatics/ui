import { createFileRoute } from '@tanstack/react-router';
import PayPage from '@/features/damorex/pay/page';

export const Route = createFileRoute('/damorex/pay/$token')({
  component: PayPage,
});