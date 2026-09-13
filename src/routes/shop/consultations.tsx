import { createFileRoute } from '@tanstack/react-router';
import ConsultationsPage from '@/features/shop/consultations/list';

export const Route = createFileRoute('/shop/consultations')({
  component: ConsultationsPage,
});
