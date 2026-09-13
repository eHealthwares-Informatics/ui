import { DataPageShell } from '../../../components/page/data-page-shell';
import { paymentsConfig } from './schema';

export function RxPaymentsPage() {
  return <DataPageShell config={paymentsConfig} />;
}
