import { createFileRoute } from '@tanstack/react-router';
import { PatientProfilePage } from '@/features/emr/pages/patient-profile-page';

export const Route = createFileRoute('/_authenticated/emr/patients/$patientId')({
  component: PatientProfilePage,
});
