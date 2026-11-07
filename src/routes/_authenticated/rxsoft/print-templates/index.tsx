import { createFileRoute } from '@tanstack/react-router';
import { RxPrintTemplatesPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/print-templates/')({
  component: RxPrintTemplatesPage,
});
