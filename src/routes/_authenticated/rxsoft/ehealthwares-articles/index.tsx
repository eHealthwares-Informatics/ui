import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresArticlesPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-articles/')({
  component: EhealthwaresArticlesPage,
});
