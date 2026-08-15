import { DataPageShell } from '@/features/components/page/data-page-shell';
import { ehealthwaresServicesConfig } from './schema';

export function EhealthwaresServicesPage() {
  return <DataPageShell config={ehealthwaresServicesConfig} />;
}
