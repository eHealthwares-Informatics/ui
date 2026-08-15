import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresSectionsPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-sections/')({
  component: EhealthwaresSectionsPage,
});
