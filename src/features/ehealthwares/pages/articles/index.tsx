import { DataPageShell } from '@/features/components/page/data-page-shell';
import { ehealthwaresArticlesConfig } from './schema';

export function EhealthwaresArticlesPage() {
  return <DataPageShell config={ehealthwaresArticlesConfig} />;
}
