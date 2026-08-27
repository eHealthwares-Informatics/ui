import { createFileRoute } from '@tanstack/react-router';
import { RxPaymentProvidersPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/payment-providers/')({
  component: RxPaymentProvidersPage,
});
