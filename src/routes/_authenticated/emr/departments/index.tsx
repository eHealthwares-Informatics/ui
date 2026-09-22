import { createFileRoute } from '@tanstack/react-router';
import { DepartmentsPage } from '@/features/emr/pages/departments';

export const Route = createFileRoute('/_authenticated/emr/departments/')({
  component: DepartmentsPage,
});