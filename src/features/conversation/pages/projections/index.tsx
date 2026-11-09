import { DataPageShell } from '@/components/page/data-page-shell';
import { projectionsConfig } from './schema';

export function RxProjectionsPage() {
  return <DataPageShell config={projectionsConfig} />;
}

export { RxProjectionDetailsPage } from './detail';
export { projectionsConfig } from './schema';
