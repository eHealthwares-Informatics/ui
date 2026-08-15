import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresPartnersPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-partners/')({
  component: EhealthwaresPartnersPage,
});
