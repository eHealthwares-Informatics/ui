import { DataPageShell } from '@/features/components/page/data-page-shell';
import { tagsConfig } from './schema';

export function TagsPage() {
  return <DataPageShell config={tagsConfig} />;
}
