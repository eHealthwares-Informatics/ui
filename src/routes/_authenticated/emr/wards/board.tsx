import { createFileRoute } from '@tanstack/react-router';
import { BedAllocationsPage } from '@/features/emr/pages/wards/beds-page';

export const Route = createFileRoute('/_authenticated/emr/wards/board')({
  component: BedAllocationsPage,
});