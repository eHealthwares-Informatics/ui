import { createFileRoute } from '@tanstack/react-router';
import { RxBillingRulesPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/billing-rules/')({
  component: RxBillingRulesPage,
});
