import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresCategoriesPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-categories/')({
  component: EhealthwaresCategoriesPage,
});
