import { createFileRoute } from '@tanstack/react-router';
import { Chats } from '@/features/conversation/chats';

export const Route = createFileRoute('/_authenticated/conversation/chats/')({
  component: Chats,
});
