import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresCareersPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-careers/')({
  component: EhealthwaresCareersPage,
});
