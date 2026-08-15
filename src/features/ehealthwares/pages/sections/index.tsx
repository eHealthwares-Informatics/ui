import { DataPageShell } from '@/features/components/page/data-page-shell';
import { ehealthwaresSectionsConfig } from './schema';

export function EhealthwaresSectionsPage() {
  return <DataPageShell config={ehealthwaresSectionsConfig} />;
}
