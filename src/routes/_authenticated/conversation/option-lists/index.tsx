import { createFileRoute } from '@tanstack/react-router';
import { RxOptionListsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/option-lists/')({
  component: RxOptionListsPage,
});
