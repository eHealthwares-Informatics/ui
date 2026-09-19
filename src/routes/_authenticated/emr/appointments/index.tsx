import { createFileRoute } from '@tanstack/react-router';
import { AppointmentsPage } from '@/features/emr/pages/appointments/appointments-page';

export const Route = createFileRoute('/_authenticated/emr/appointments/')({
  component: AppointmentsPage,
});