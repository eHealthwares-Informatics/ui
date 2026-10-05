import { createFileRoute } from '@tanstack/react-router';
import { RxWebsiteRewardProgramsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/website-reward-programs/')({
  component: RxWebsiteRewardProgramsPage,
});
