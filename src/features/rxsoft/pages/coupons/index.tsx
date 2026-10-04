import { DataPageShell } from '@/features/components/page/data-page-shell';
import { couponsConfig } from './schema';

export function RxCouponsPage() {
  return <DataPageShell config={couponsConfig} />;
}
