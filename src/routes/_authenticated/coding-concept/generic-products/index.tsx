import { createFileRoute } from '@tanstack/react-router';
import { CodedGenericProductsPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute('/_authenticated/coding-concept/generic-products/')({
  component: CodedGenericProductsPage,
});
