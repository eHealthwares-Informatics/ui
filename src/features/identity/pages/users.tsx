import { DataPageShell } from '@/components/page/data-page-shell';
import { identityUsersConfig } from '../schema/users';

export function IdentityUsersPage() {
  return <DataPageShell config={identityUsersConfig} />;
}
