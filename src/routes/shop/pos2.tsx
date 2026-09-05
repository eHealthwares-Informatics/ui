import { createFileRoute } from '@tanstack/react-router';
import DamorexPage from '@/features/damorex/page';
import PosSalesPage from '@/features/damorex/pos/pos2';

/* ================= ROUTE ================= */

export const Route = createFileRoute('/shop/pos2')({
  component: PosSalesPage,
});
