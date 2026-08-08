import { createFileRoute } from '@tanstack/react-router';
import { LisEqaEnrollmentsPage } from '@/features/lis/pages';

export const Route = createFileRoute('/_authenticated/lis/eqa-enrollments/')({
  component: LisEqaEnrollmentsPage,
});