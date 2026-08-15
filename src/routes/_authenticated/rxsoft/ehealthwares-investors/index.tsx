import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresInvestorsPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-investors/')({
  component: EhealthwaresInvestorsPage,
});
