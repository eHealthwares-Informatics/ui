import { DataPageShell } from '@/features/components/page/data-page-shell';
import { ehealthwaresCategoriesConfig } from './schema';

export function EhealthwaresCategoriesPage() {
  return <DataPageShell config={ehealthwaresCategoriesConfig} />;
}
