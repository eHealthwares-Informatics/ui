import { createFileRoute } from '@tanstack/react-router';
import { CodedLaboratoriesPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute('/_authenticated/coding-concept/facilities/laboratories/')({
  component: CodedLaboratoriesPage,
});
