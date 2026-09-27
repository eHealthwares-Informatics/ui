import { createFileRoute, redirect } from '@tanstack/react-router';
import { modules, type ModuleId } from '@/features/shared/module-data';

const MODULE_STORAGE_KEY = 'rxsoft_admin_selected_module';

export const Route = createFileRoute('/_authenticated/$moduleId')({
  beforeLoad: ({ params, location }) => {
    const { moduleId } = params;

    const validModules = modules.map((m) => m.id);

    if (!validModules.includes(moduleId as ModuleId)) {
      throw redirect({
        to: '/',
        replace: true,
      });
    }

    // only redirect "/rxsoft"
    if (location.pathname === `/${moduleId}`) {
      const mod = modules.find((m) => m.id === moduleId)!;

      localStorage.setItem(MODULE_STORAGE_KEY, moduleId);

      throw redirect({
        to: mod.root,
        replace: true,
      });
    }
  },
});
