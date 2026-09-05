import { createFileRoute } from '@tanstack/react-router';
import { RxInviteDetailsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/conversation/invites/$inviteId')({
  component: InviteDetailsRoute,
});

function InviteDetailsRoute() {
  const { inviteId } = Route.useParams();
  return <RxInviteDetailsPage inviteId={inviteId} />;
}
