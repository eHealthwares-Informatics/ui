import { DataPageShell } from '@/components/page/data-page-shell';
import { identityOrganizationsConfig } from '../schema/organizations';

export function IdentityOrganizationsPage() {
  return <DataPageShell config={identityOrganizationsConfig} />;
}
