import { createFileRoute } from '@tanstack/react-router';
import { RxOrganisationConfigPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/organisation-config/')({
  component: RxOrganisationConfigPage,
});
