import { SimpleGrid } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useSetSelectedModule } from '@/context/module-context';
import type { ModuleId } from '@/features/shared/module-data';
import { getModuleDashboard } from '@/lib/module-routing';
import type { ModuleInfo } from '@/stores/auth-store';
import { ModuleCard } from './module-card';

type ModuleGridProps = {
  modules: ModuleInfo[];
  /** Test seam: invoked with the chosen module id (navigation is stubbed in tests). */
  onSelect?: (moduleId: ModuleId) => void;
};

/**
 * Presentational grid of the modules available to the signed-in user
 * (ROLE-level enforcement: the list comes from identity's permission-derived
 * getUserModules via /auth/me — users only ever see modules their
 * permissions grant).
 */
export function ModuleGrid({ modules, onSelect }: ModuleGridProps) {
  const navigate = useNavigate();
  const setSelectedModuleId = useSetSelectedModule();

  const handleSelect = (moduleId: ModuleId) => {
    setSelectedModuleId(moduleId);
    onSelect?.(moduleId);
    navigate({ to: getModuleDashboard(moduleId) });
  };

  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, lg: 3 }}
      spacing={{ base: 'sm', sm: 'md', lg: 'lg' }}
      verticalSpacing={{ base: 'sm', sm: 'md', lg: 'lg' }}
      data-testid="module-grid"
    >
      {modules.map((mod) => (
        <ModuleCard key={mod.id} module={mod} onSelect={handleSelect} />
      ))}
    </SimpleGrid>
  );
}
