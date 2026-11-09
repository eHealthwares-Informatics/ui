import { DataPageShell } from '@/components/page/data-page-shell';
import { paymentMethodsConfig } from './schema';

export function RxPaymentMethodsPage() {
  return <DataPageShell config={paymentMethodsConfig} />;
}
