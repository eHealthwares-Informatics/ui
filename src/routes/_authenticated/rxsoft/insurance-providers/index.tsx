import { createFileRoute } from '@tanstack/react-router';
import { RxInsuranceProvidersPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/insurance-providers/')({
  component: RxInsuranceProvidersPage,
});
