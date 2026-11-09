import { createFileRoute } from '@tanstack/react-router';
import { DataPageForm } from '@/components/page/data-page-form';
import { itemsConfig } from '@/features/rxsoft/pages/products/types/schema';

export const Route = createFileRoute('/_authenticated/rxsoft/items/create')({
  component: ItemCreatePage,
});

function ItemCreatePage() {
  return <DataPageForm config={itemsConfig} />;
}
