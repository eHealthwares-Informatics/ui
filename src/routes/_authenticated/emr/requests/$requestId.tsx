import { createFileRoute } from '@tanstack/react-router';
import { RequestDetailPage } from '@/features/emr/pages/request-detail-page';

export const Route = createFileRoute('/_authenticated/emr/requests/$requestId')({
  component: RequestDetailPage,
});
