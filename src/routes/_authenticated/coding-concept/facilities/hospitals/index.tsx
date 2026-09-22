import { createFileRoute } from '@tanstack/react-router';
import { CodedHospitalsPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute('/_authenticated/coding-concept/facilities/hospitals/')({
  component: CodedHospitalsPage,
});
