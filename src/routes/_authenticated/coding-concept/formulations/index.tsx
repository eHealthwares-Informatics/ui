import { createFileRoute } from '@tanstack/react-router';
import { CodedFormulationsPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute('/_authenticated/coding-concept/formulations/')({
  component: CodedFormulationsPage,
});
