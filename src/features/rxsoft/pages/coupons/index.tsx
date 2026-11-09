import { DataPageShell } from '@/components/page/data-page-shell';
import { couponsConfig } from './schema';

export function RxCouponsPage() {
  return <DataPageShell config={couponsConfig} />;
}
