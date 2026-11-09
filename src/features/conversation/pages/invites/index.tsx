import { DataPageShell } from '@/components/page/data-page-shell';
import { invitesConfig } from './schema';

export function RxInvitesPage() {
  return <DataPageShell config={invitesConfig} />;
}

export { RxInviteDetailsPage } from './detail';
export { invitesConfig } from './schema';
