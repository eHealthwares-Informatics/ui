import { DataPageShell } from '@/components/page/data-page-shell';
import { aiProcessorsConfig } from './schema';

export function RxAIProcessorsPage() {
  return <DataPageShell config={aiProcessorsConfig} />;
}

export { aiProcessorsConfig } from './schema';
