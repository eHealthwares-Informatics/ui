import { DataPageShell } from '@/components/page/data-page-shell';
import { branchesConfig } from './schema';

export function RxBranchesPage() {
  return <DataPageShell config={branchesConfig} />;
}
