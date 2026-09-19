import { DataPageShell } from '@/features/components/page/data-page-shell';
import { departmentsConfig } from '../../registry/departments';

export function DepartmentsPage() {
  return <DataPageShell config={departmentsConfig} />;
}