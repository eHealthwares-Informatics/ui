import { DataPageShell } from '@/components/page/data-page-shell';
import { usersConfig } from './schema';

export function RxUsersPage() {
  return <DataPageShell config={usersConfig} />;
}
