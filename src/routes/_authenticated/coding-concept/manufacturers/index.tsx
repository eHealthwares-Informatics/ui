import { createFileRoute } from '@tanstack/react-router';
import { CodedManufacturersPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute('/_authenticated/coding-concept/manufacturers/')({
  component: CodedManufacturersPage,
});
