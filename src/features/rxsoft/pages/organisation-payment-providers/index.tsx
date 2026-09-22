import { DataPageShell } from '../../../components/page/data-page-shell';
import { organisationPaymentProvidersConfig } from './schema';

export function RxOrganisationPaymentProvidersPage() {
  return <DataPageShell config={organisationPaymentProvidersConfig} />;
}