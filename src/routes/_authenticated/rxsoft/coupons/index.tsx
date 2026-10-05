import { createFileRoute } from '@tanstack/react-router';
import { RxCouponsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/coupons/')({
  component: RxCouponsPage,
});
