import { createFileRoute } from '@tanstack/react-router';
import { PublicFormPage } from '@/features/emr/pages/public-form-page';

export const Route = createFileRoute('/f/$token')({
  component: PublicFormPage,
});
