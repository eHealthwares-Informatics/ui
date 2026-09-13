import { createFileRoute } from '@tanstack/react-router';
import DamorexPage from '@/features/shop/page';
import PosSalesPage from '@/features/shop/pos/pos2';

/* ================= ROUTE ================= */

export const Route = createFileRoute('/shop/pos2')({
  component: PosSalesPage,
});
