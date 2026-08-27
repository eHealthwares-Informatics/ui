import { DataPageShell } from '../../../components/page/data-page-shell';
import { insuranceProvidersConfig } from './schema';

export function RxInsuranceProvidersPage() {
  return <DataPageShell config={insuranceProvidersConfig} />;
}