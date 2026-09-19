import { createFileRoute } from '@tanstack/react-router';
import { WardsPage } from '@/features/emr/pages/wards/wards-page';

export const Route = createFileRoute('/_authenticated/emr/wards/')({
  component: WardsPage,
});