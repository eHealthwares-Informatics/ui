import { createFileRoute } from '@tanstack/react-router';
import { TagsPage } from '@/features/emr/pages/tags';

export const Route = createFileRoute('/_authenticated/emr/tags/')({
  component: TagsPage,
});
