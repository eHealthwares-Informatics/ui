import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresContactSubmissionsPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-contact-submissions/')({
  component: EhealthwaresContactSubmissionsPage,
});
