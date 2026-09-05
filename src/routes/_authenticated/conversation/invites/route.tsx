import { createFileRoute } from '@tanstack/react-router';
import { RxInvitesPage } from '@/features/rxsoft/pages/conversation';

export const Route = createFileRoute('/_authenticated/conversation/invites')({
  component: RxInvitesPage,
});
