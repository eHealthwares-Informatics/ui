import { createFileRoute } from '@tanstack/react-router';
import PurchasesPage from '@/features/damorex/po/purchases';

export const Route = createFileRoute('/shop/purchases/')({
  component: PurchasesPage,
});
