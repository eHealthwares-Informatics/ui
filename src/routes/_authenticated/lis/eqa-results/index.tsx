import { createFileRoute } from '@tanstack/react-router';
import { LisEqaResultsPage } from '@/features/lis/pages';

export const Route = createFileRoute('/_authenticated/lis/eqa-results/')({
  component: LisEqaResultsPage,
});