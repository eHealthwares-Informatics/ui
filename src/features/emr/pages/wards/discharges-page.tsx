import { DataPageShell } from '@/features/components/page/data-page-shell';
import { dischargesConfig } from '../../registry/discharges';

export function DischargesPage() {
  return <DataPageShell config={dischargesConfig} />;
}