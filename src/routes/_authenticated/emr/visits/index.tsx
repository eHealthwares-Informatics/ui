import { createFileRoute } from '@tanstack/react-router';
import { VisitsPage } from '@/features/emr/pages/visits';

export const Route = createFileRoute('/_authenticated/emr/visits/')({
  component: VisitsPage,
});