import { DataPageShell } from '@/components/page/data-page-shell';
import { rolesConfig } from '@/features/admin/schema/roles';

export function RxRolesPage() {
  return <DataPageShell config={rolesConfig} />;
}
