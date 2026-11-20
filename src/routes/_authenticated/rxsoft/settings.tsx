import { createFileRoute } from '@tanstack/react-router';
import { RxSettingsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/settings')({
  component: RxSettingsPage,
});
