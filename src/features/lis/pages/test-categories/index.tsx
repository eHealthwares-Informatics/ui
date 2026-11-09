import { DataPageShell } from '@/components/page/data-page-shell';
import { testCategoriesConfig } from './schema';

export function LisTestCategoriesPage() {
  return <DataPageShell config={testCategoriesConfig} />;
}
