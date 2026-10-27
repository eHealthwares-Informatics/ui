import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresCareerApplicationsPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-career-applications/')({
  component: EhealthwaresCareerApplicationsPage,
});
