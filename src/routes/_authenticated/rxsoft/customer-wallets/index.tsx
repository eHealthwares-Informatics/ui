import { createFileRoute } from '@tanstack/react-router';
import { RxCustomerWalletsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/customer-wallets/')({
  component: RxCustomerWalletsPage,
});
