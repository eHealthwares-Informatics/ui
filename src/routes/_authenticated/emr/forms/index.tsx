import { createFileRoute } from '@tanstack/react-router';
import { FormsPage } from '@/features/emr/pages/forms-page';

export const Route = createFileRoute('/_authenticated/emr/forms/')({
  component: FormsPage,
});
