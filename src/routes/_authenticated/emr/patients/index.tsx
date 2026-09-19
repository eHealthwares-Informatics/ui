import { createFileRoute } from '@tanstack/react-router';
import { PatientsPage } from '@/features/emr/pages/patients/patients-page';

export const Route = createFileRoute('/_authenticated/emr/patients/')({
  component: PatientsPage,
});