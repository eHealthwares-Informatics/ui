import { createFileRoute } from '@tanstack/react-router';
import { ModuleDashboardPage } from '@/features/rxsoft/pages/module-dashboard/page';

export const Route = createFileRoute('/_authenticated/communication/dashboard')({
  component: () => <ModuleDashboardPage moduleId="communication" />,
});
