import { createFileRoute } from '@tanstack/react-router';
import { CodedDosageFormsPage } from '@/features/coding-concept/pages';

export const Route = createFileRoute('/_authenticated/coding-concept/dosage-forms/')({
  component: CodedDosageFormsPage,
});
