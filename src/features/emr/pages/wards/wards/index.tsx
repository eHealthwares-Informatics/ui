import { DataPageShell } from '@/features/components/page/data-page-shell';
import { wardsConfig } from './schema';

export function WardsPage() {
  return <DataPageShell config={wardsConfig} />;
}
