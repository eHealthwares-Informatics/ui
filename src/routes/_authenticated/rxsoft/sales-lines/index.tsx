import { createFileRoute } from '@tanstack/react-router';
import { RxSalesLinesPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/sales-lines/')({
  validateSearch: (search: Record<string, unknown>) => ({
    saleId: typeof search.saleId === 'string' ? search.saleId : undefined,
  }),
  component: SalesLinesPage,
});

function SalesLinesPage() {
  const { saleId } = Route.useSearch();
  return <RxSalesLinesPage saleId={saleId} />;
}