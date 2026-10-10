import { createFileRoute } from '@tanstack/react-router';
import { RxOrdersPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/orders/')({
  component: RxOrdersPage,
});
