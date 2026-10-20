import { createFileRoute } from '@tanstack/react-router';
import { RxPaymentTransactionDetailPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/payment-transactions/$transactionId')({
  component: PaymentTransactionDetailRoute,
});

function PaymentTransactionDetailRoute() {
  const { transactionId } = Route.useParams();
  return <RxPaymentTransactionDetailPage transactionId={transactionId} />;
}
