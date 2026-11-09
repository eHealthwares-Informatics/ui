import { DataPageShell } from '@/components/page/data-page-shell';
import { locationTypesConfig } from './schema';

export function LisLocationTypesPage() {
  return <DataPageShell config={locationTypesConfig} />;
}
