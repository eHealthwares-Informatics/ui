import { DataPageShell } from '@/features/components/page/data-page-shell';
import { departmentsConfig } from './schema';

export function DepartmentsPage() {
  return <DataPageShell config={departmentsConfig} />;
}
