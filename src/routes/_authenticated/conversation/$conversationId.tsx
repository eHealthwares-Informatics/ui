import { createFileRoute } from '@tanstack/react-router';
import { RxConversationDetailsPage } from '@/features/rxsoft/pages/conversation';

export const Route = createFileRoute('/_authenticated/conversation/$conversationId')({
  component: ConversationDetailsRoute,
});

function ConversationDetailsRoute() {
  const { conversationId } = Route.useParams();
  return <RxConversationDetailsPage conversationId={conversationId} />;
}
