import { DataPageShell } from '@/features/components/page/data-page-shell';
import { identityRolesConfig } from '../schema/roles';

export function IdentityRolesPage() {
  return <DataPageShell config={identityRolesConfig} />;
}
