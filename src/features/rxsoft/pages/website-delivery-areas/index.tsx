import { DataPageShell } from '@/features/components/page/data-page-shell';
import { deliveryAreasConfig } from './schema';

export function RxWebsiteDeliveryAreasPage() {
  return <DataPageShell config={deliveryAreasConfig} />;
}
