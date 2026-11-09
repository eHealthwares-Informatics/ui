import { DataPageShell } from '@/components/page/data-page-shell';
import { dischargesConfig } from './schema';

export function DischargesPage() {
  return <DataPageShell config={dischargesConfig} />;
}
