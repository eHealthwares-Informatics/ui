import { useMemo } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { RxPage } from '@/features/components/page/rx-page';
import { buildSalesLinesConfig } from './schema';

export function RxSalesLinesPage({ saleId }: { saleId?: string }) {
  const config = useMemo(() => buildSalesLinesConfig(saleId ?? null), [saleId]);

  return (
    <RxPage title="Sales Lines" description="Line-level detail for sales, filterable by sale.">
      <DataPageShell key={saleId ?? ''} config={config} />
    </RxPage>
  );
}