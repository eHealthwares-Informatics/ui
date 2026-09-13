import { createFileRoute } from '@tanstack/react-router';
import { RxUserConfigPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/user-config/')({
  component: RxUserConfigPage,
});
