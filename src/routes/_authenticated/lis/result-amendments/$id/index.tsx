import { createFileRoute } from '@tanstack/react-router';
import { LisResultAmendmentsPage } from '@/features/lis/pages';

export const Route = createFileRoute('/_authenticated/lis/result-amendments/$id/')({
  component: LisResultAmendmentsPage,
});