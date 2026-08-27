import { createFileRoute } from '@tanstack/react-router';
import { VisitDetailPage } from '@/features/emr/pages/visit-detail-page';

export const Route = createFileRoute('/_authenticated/emr/visits/$visitId')({
  component: VisitDetailPage,
});
