import { createFileRoute } from '@tanstack/react-router';
import { BedsListPage } from '@/features/emr/pages/wards/beds-list-page';

export const Route = createFileRoute('/_authenticated/emr/wards/beds')({
  component: BedsListPage,
});