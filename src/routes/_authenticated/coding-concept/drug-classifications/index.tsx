import { createFileRoute } from '@tanstack/react-router';
import { CodedDrugClassificationsPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute('/_authenticated/coding-concept/drug-classifications/')({
  component: CodedDrugClassificationsPage,
});