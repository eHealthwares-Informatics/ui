import { createFileRoute } from '@tanstack/react-router';
import { RxPaymentsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/payments/')({
  component: RxPaymentsPage,
});
