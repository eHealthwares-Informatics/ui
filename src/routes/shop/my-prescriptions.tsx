import { createFileRoute } from '@tanstack/react-router';
import MyPrescriptionsPage from '@/features/shop/prescriptions/list';

export const Route = createFileRoute('/shop/my-prescriptions')({
  component: MyPrescriptionsPage,
});
