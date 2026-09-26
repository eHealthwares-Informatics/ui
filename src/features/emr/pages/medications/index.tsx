import { DataPageShell } from '@/features/components/page/data-page-shell';
import { medicationsConfig } from './schema';

export function MedicationsPage() {
  return <DataPageShell config={medicationsConfig} />;
}
