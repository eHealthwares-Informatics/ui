import { createFileRoute, redirect } from '@tanstack/react-router';
import { modules, type ModuleId } from '@/features/shared/module-data';
import { writeSelectedModuleId } from '@/lib/module-storage';

export const Route = createFileRoute('/_authenticated/$moduleId/')({
  beforeLoad: ({ params }) => {
    const { moduleId } = params;
    const validModules = modules.map((m) => m.id);
    if (validModules.includes(moduleId as ModuleId)) {
      const mod = modules.find((m) => m.id === moduleId)!;
      writeSelectedModuleId(moduleId);
      throw redirect({ to: mod.root, replace: true });
    }
    throw redirect({ to: '/', replace: true });
  },
});
