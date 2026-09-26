import { createFileRoute } from '@tanstack/react-router';
import { ReferralsPage } from '@/features/emr/pages/referrals';

export const Route = createFileRoute('/_authenticated/emr/referrals/')({
  component: ReferralsPage,
});
