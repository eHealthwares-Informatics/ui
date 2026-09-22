import { createFileRoute } from '@tanstack/react-router';
import { RequestsPage } from '@/features/emr/pages/requests';

export const Route = createFileRoute('/_authenticated/emr/requests/')({
  component: RequestsPage,
});