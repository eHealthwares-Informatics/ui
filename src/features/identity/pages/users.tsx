import { DataPageShell } from '@/features/components/page/data-page-shell';
import { identityUsersConfig } from '../schema/users';

export function IdentityUsersPage() {
  return <DataPageShell config={identityUsersConfig} />;
}
