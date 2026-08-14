import { createFileRoute } from '@tanstack/react-router';
import { LisQaChecklistItemsPage } from '@/features/lis/pages';

export const Route = createFileRoute('/_authenticated/lis/qa-checklist-items/')({
  component: LisQaChecklistItemsPage,
});
