import { JsonDetailCard } from '@/components/form/json-detail-card';

export function RxItemDetailsPage({ itemId }: { itemId: string }) {
  return (
    <JsonDetailCard
      title="Item Details"
      endpoint={`/items/${itemId}`}
      backTo="/items"
      emptyLabel="GET /items/{itemId}"
    />
  );
}
