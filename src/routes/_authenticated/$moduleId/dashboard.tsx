import { createFileRoute, redirect } from '@tanstack/react-router';
import { modules } from '@/features/shared/module-data';
import { ModuleDashboardPage } from '@/features/rxsoft/pages/module-dashboard/page';

export const Route = createFileRoute('/_authenticated/$moduleId/dashboard')({
  beforeLoad: ({ params }) => {
    const validModules = modules.map((m) => m.id);
    if (!validModules.includes(params.moduleId as never)) {
      throw redirect({ to: '/', replace: true });
    }
  },
  // Fallback for modules without a dedicated static dashboard route —
  // static per-module routes take precedence over this one.
  component: ModuleDashboardPageRoute,
});

function ModuleDashboardPageRoute() {
  const { moduleId } = Route.useParams();
  return <ModuleDashboardPage moduleId={moduleId} />;
}
