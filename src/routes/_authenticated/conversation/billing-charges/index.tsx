import { createFileRoute } from '@tanstack/react-router';
import { RxBillingChargesPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/billing-charges/')({
  component: RxBillingChargesPage,
});
