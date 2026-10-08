import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ModuleContext, type ModuleContextType } from '@/context/module-context';
import { modules, type ModuleId, moduleMap } from '@/features/shared/module-data';
import { useAuthStore } from '@/stores/auth-store';

const MODULE_STORAGE_KEY = 'rxsoft_admin_selected_module';

/**
 * Picks the best initial module:
 * 1. Stored in localStorage (if the user has access to it)
 * 2. First module the user has access to
 * 3. Hardcoded fallback 'rxsoft'
 */
const getInitialModule = (userModules: { id: string }[]): ModuleId => {
  if (typeof window === 'undefined') {
    return (userModules[0]?.id as ModuleId) || 'rxsoft';
  }

  const stored = window.localStorage.getItem(MODULE_STORAGE_KEY);
  if (stored && userModules.some((m) => m.id === stored)) {
    return stored as ModuleId;
  }

  if (userModules.length > 0) {
    return userModules[0].id as ModuleId;
  }

  return 'rxsoft';
};

/**
 * Bootstrap wrapper. Defined at module scope on purpose: declaring it inside
 * `ModuleProvider` gives it a new component identity on every provider render,
 * which makes React unmount and remount the entire subtree (see
 * ehealthwares/ui#84).
 */
function AppBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('React app is fully loaded and mounted!');
  }, []);

  return children;
}

export interface ModuleProviderProps {
  children: ReactNode;
  defaultModule?: ModuleId;
}

export function ModuleProvider({ children, defaultModule }: ModuleProviderProps) {
  const storeModules = useAuthStore((state) => state.modules);
  const [selectedModule, setSelectedModuleState] = useState<ModuleId>(
    defaultModule || getInitialModule(storeModules)
  );

  // When user modules load (async from /auth/me), sync the selected module:
  // - If current selection isn't in the user's modules, switch to the first one they have
  // - If localStorage stored a module the user no longer has, update it
  useEffect(() => {
    if (storeModules.length === 0) {
      return;
    }

    const hasAccess = storeModules.some((m) => m.id === selectedModule);
    if (!hasAccess) {
      const firstAvailable = storeModules[0]?.id as ModuleId | undefined;
      if (firstAvailable && moduleMap[firstAvailable]) {
        setSelectedModuleState(firstAvailable);
        window.localStorage.setItem(MODULE_STORAGE_KEY, firstAvailable);
      }
    }
  }, [storeModules, selectedModule]);

  const setSelectedModule = useCallback((moduleId: ModuleId) => {
    setSelectedModuleState(moduleId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODULE_STORAGE_KEY, moduleId);
    }
  }, []);

  // Fallback to first module if somehow we don't have a definition.
  const currentModuleDefinition = moduleMap[selectedModule];
  const fallbackModule = currentModuleDefinition || modules[0];

  // Memoize the context value so consumers only re-render when the selected
  // module actually changes, not on every provider render.
  const contextValue: ModuleContextType = useMemo(
    () => ({
      selectedModule,
      setSelectedModule,
      currentModuleDefinition: fallbackModule,
      moduleId: selectedModule,
      apiProvider: fallbackModule.apiProvider,
      moduleName: fallbackModule.title,
      moduleDescription: fallbackModule.description,
      moduleRoot: fallbackModule.root,
      modules,
    }),
    [selectedModule, setSelectedModule, fallbackModule]
  );

  return (
    <ModuleContext.Provider value={contextValue}>
      <AppBootstrap>{children}</AppBootstrap>
    </ModuleContext.Provider>
  );
}
