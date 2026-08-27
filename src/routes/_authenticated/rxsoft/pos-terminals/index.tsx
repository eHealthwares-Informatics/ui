import { createFileRoute } from '@tanstack/react-router';
import { RxPosTerminalsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/pos-terminals/')({
  component: RxPosTerminalsPage,
});
