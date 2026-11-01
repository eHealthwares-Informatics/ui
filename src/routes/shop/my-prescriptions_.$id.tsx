import { createFileRoute } from '@tanstack/react-router';
import PrescriptionDetailPage from '@/features/shop/prescriptions/detail';

export const Route = createFileRoute('/shop/my-prescriptions_/$id')({
  component: PrescriptionDetailPage,
});
