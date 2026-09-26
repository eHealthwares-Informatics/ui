import { createFileRoute } from '@tanstack/react-router';
import { MedicationsPage } from '@/features/emr/pages/medications';

export const Route = createFileRoute('/_authenticated/emr/medications/')({
  component: MedicationsPage,
});
