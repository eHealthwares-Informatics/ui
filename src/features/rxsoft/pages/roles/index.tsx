import { rolesConfig } from '@/features/admin/schema/roles';
import { DataPageShell } from '@/features/components/page/data-page-shell';

export function RxRolesPage() {
  return <DataPageShell config={rolesConfig} />;
}
