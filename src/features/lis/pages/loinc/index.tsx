import { DataPageShell } from '@/components/page/data-page-shell';
import { loincConfig } from './schema';

export function LisLoincPage() {
  return <DataPageShell config={loincConfig} />;
}
