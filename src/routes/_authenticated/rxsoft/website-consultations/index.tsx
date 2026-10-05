import { createFileRoute } from '@tanstack/react-router';
import { RxWebsiteConsultationsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/website-consultations/')({
  component: RxWebsiteConsultationsPage,
});
