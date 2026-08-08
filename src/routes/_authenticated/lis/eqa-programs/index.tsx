import { createFileRoute } from '@tanstack/react-router';
import { LisEqaProgramsPage } from '@/features/lis/pages';

export const Route = createFileRoute('/_authenticated/lis/eqa-programs/')({
  component: LisEqaProgramsPage,
});