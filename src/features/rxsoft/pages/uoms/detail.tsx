import { JsonDetailCard } from '@/components/form/json-detail-card';

export function RxUomDetailsPage({ uomId }: { uomId: string }) {
  return (
    <JsonDetailCard
      title="UOM Details"
      endpoint={`/uoms/${uomId}`}
      backTo="/uoms"
      emptyLabel="GET /uoms/{uomId}"
    />
  );
}
