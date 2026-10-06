import { createFileRoute } from '@tanstack/react-router';
import { MessageTemplatesPage } from '@/features/emr/pages/settings/message-templates';

export const Route = createFileRoute('/_authenticated/emr/settings/message-templates/')({
  component: MessageTemplatesPage,
});
