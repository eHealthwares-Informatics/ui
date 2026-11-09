import { DataPageShell } from '@/components/page/data-page-shell';
import { sampleTypesConfig } from './schema';

export function LisSampleTypesPage() {
  return <DataPageShell config={sampleTypesConfig} />;
}
