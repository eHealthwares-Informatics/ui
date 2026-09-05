import { createFileRoute } from '@tanstack/react-router';
import DamorexPage from '@/features/damorex/page';

/* ================= ROUTE ================= */

export const Route = createFileRoute('/shop/')({
  component: DamorexPage,
});
