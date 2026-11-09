import { createFileRoute } from '@tanstack/react-router';
import { RxBillingConfigPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/billing-config/')({
  component: RxBillingConfigPage,
});
