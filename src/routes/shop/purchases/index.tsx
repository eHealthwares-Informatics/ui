import { createFileRoute } from '@tanstack/react-router';
import PurchasesPage from '@/features/shop/po/purchases';

export const Route = createFileRoute('/shop/purchases/')({
  component: PurchasesPage,
});
