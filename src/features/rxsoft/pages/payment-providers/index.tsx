import { DataPageShell } from '../../../components/page/data-page-shell';
import { paymentProvidersConfig } from './schema';

export function RxPaymentProvidersPage() {
  return <DataPageShell config={paymentProvidersConfig} />;
}