import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresTeamPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-team/')({
  component: EhealthwaresTeamPage,
});
