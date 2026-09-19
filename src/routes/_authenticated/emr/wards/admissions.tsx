import { createFileRoute } from '@tanstack/react-router';
import { AdmissionsPage } from '@/features/emr/pages/wards/admissions-page';

export const Route = createFileRoute('/_authenticated/emr/wards/admissions')({
  component: AdmissionsPage,
});