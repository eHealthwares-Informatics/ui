import { createFileRoute } from '@tanstack/react-router';
import { RequestsPage } from '@/features/emr/pages/requests/requests-page';

export const Route = createFileRoute('/_authenticated/emr/requests/')({
  component: RequestsPage,
});