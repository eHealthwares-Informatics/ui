import { createFileRoute } from '@tanstack/react-router';
import DamorexPage from '@/features/damorex/page';
import PharmacyPOS from '@/features/damorex/pos/pos';

/* ================= ROUTE ================= */

export const Route = createFileRoute('/shop/pos')({
  component: PharmacyPOS,
});
