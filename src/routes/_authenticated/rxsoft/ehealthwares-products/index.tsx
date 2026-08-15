import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresProductsPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-products/')({
  component: EhealthwaresProductsPage,
});
