import { DataPageShell } from '@/components/page/data-page-shell';
import { pharmaceuticsConfig } from './schema';

export function RxPharmaceuticsPage() {
  return <DataPageShell config={pharmaceuticsConfig} />;
}
