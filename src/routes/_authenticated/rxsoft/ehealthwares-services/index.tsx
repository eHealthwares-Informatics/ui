import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresServicesPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-services/')({
  component: EhealthwaresServicesPage,
});
