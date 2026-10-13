import { createFileRoute } from '@tanstack/react-router';
import { RxPriceAdjustmentsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/price-adjustments/')({
  component: RxPriceAdjustmentsPage,
});
