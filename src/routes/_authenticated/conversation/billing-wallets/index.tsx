import { createFileRoute } from '@tanstack/react-router';
import { RxBillingWalletsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/billing-wallets/')({
  component: RxBillingWalletsPage,
});
