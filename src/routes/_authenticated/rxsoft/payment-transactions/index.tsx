import { createFileRoute } from '@tanstack/react-router';
import { RxPaymentTransactionsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/payment-transactions/')({
  component: RxPaymentTransactionsPage,
});
