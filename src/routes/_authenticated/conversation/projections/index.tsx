import { createFileRoute } from '@tanstack/react-router';
import { RxProjectionsPage } from '@/features/conversation';

export const Route = createFileRoute('/_authenticated/conversation/projections/')({
  component: RxProjectionsPage,
});
