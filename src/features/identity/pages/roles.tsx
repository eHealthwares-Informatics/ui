import { rolesConfig } from '@/features/admin/schema/roles';
import { DataPageShell } from '@/features/components/page/data-page-shell';

export function IdentityRolesPage() {
  return <DataPageShell config={rolesConfig} />;
}
