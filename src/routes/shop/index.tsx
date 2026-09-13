import { createFileRoute } from '@tanstack/react-router';
import DamorexPage from '@/features/shop/page';

/* ================= ROUTE ================= */

export const Route = createFileRoute('/shop/')({
  component: DamorexPage,
});
