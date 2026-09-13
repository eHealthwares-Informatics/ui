import { createFileRoute } from '@tanstack/react-router';
import { CodedPharmaciesPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute('/_authenticated/coding-concept/facilities/pharmacies/')({
  component: CodedPharmaciesPage,
});
