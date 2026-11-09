import { DataPageShell } from '@/components/page/data-page-shell';
import { departmentsConfig } from './schema';

export function DepartmentsPage() {
  return <DataPageShell config={departmentsConfig} />;
}
