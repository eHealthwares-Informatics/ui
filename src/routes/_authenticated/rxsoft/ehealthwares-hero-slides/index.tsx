import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresHeroSlidesPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-hero-slides/')({
  component: EhealthwaresHeroSlidesPage,
});
