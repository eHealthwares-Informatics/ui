import { DataPageShell } from '@/components/page/data-page-shell';
import { uomsConfig } from './schema';

export function LisUomsPage() {
  return <DataPageShell config={uomsConfig} />;
}
