import { createFileRoute } from '@tanstack/react-router';
import { LisNotificationsPage } from '@/features/lis/pages';

export const Route = createFileRoute('/_authenticated/lis/notifications/')({
  component: LisNotificationsPage,
});
