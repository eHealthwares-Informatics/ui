import { createFileRoute } from '@tanstack/react-router';
import ConsultationsPage from '@/features/damorex/consultations/list';

export const Route = createFileRoute('/shop/consultations')({
  component: ConsultationsPage,
});
