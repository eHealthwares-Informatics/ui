import { createFileRoute } from '@tanstack/react-router';
import { StaffPage } from '@/features/emr/pages/staff';

export const Route = createFileRoute('/_authenticated/emr/staff/')({
  component: StaffPage,
});