import { DataPageShell } from '@/features/components/page/data-page-shell';
import { dischargesConfig } from './schema';

export function DischargesPage() {
  return <DataPageShell config={dischargesConfig} />;
}
