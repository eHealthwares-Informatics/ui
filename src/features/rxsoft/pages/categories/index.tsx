import { DataPageShell } from '@/components/page/data-page-shell';
import { categoriesConfig } from './schema';

export function RxCategoriesPage() {
  return <DataPageShell config={categoriesConfig} />;
}
