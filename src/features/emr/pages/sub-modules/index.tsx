import { DataPageShell } from '@/components/page/data-page-shell';
import { subModulesConfig } from './schema';

/** Admin list of EMR sub-modules (menu groups). */
export function SubModulesPage() {
  return <DataPageShell config={subModulesConfig} />;
}
