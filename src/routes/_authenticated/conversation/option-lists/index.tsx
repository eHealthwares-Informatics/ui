import { createFileRoute } from '@tanstack/react-router';
import { RxOptionListsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/conversation/option-lists/')({
  component: RxOptionListsPage,
});
