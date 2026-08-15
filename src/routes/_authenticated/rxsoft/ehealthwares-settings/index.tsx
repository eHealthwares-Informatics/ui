import { createFileRoute } from '@tanstack/react-router';
import { EhealthwaresSettingsPage } from '@/features/ehealthwares/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/ehealthwares-settings/')({
  component: EhealthwaresSettingsPage,
});
