import { createFileRoute } from '@tanstack/react-router';
import BookConsultationPage from '@/features/shop/consultations/book';

export const Route = createFileRoute('/shop/consult-pharmacist')({
  component: BookConsultationPage,
});
