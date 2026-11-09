import { DataPageShell } from '@/components/page/data-page-shell';
import { rolesConfig } from '@/features/admin/schema/roles';

export function IdentityRolesPage() {
  return <DataPageShell config={rolesConfig} />;
}
