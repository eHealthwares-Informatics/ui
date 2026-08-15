import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresTestimonialsPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-testimonials/')({
  component: EhealthwaresTestimonialsPage,
});
