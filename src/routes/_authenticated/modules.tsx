import { createFileRoute } from '@tanstack/react-router';
import { ModuleLandingPage } from '@/features/shared/module-landing';

export const Route = createFileRoute('/_authenticated/modules')({
  component: ModuleLandingPage,
});
