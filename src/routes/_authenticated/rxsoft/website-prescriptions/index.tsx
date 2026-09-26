import { createFileRoute } from '@tanstack/react-router';
import { RxWebsitePrescriptionsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/website-prescriptions/')({
  component: RxWebsitePrescriptionsPage,
});
