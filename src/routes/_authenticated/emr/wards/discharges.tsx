import { createFileRoute } from '@tanstack/react-router';
import { DischargesPage } from '@/features/emr/pages/wards/discharges-page';

export const Route = createFileRoute('/_authenticated/emr/wards/discharges')({
  component: DischargesPage,
});