import { createFileRoute } from '@tanstack/react-router';
import { RxOrganisationPaymentProvidersPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/organisation-payment-providers/')({
  component: RxOrganisationPaymentProvidersPage,
});