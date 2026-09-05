import React, { ReactNode, useEffect, useState } from 'react';
import { ModuleContext, type ModuleContextType } from '@/context/module-context';
import { useAttributeDefinitionsBootstrap } from '@/features/queries/bootstrap';
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
    return userModules[0]?.id as ModuleId || 'rxsoft';
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

export interface ModuleProviderProps {
  children: ReactNode;
  defaultModule?: ModuleId;
}

function FullScreenLoader() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <div className="spinner" />
      <p>Loading application...</p>
    </div>
  );
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
    if (storeModules.length === 0) return;

    const hasAccess = storeModules.some((m) => m.id === selectedModule);
    if (!hasAccess) {
      const firstAvailable = storeModules[0]?.id as ModuleId | undefined;
      if (firstAvailable && moduleMap[firstAvailable]) {
        setSelectedModuleState(firstAvailable);
        window.localStorage.setItem(MODULE_STORAGE_KEY, firstAvailable);
      }
    }
  }, [storeModules]);

  const currentModuleDefinition = moduleMap[selectedModule];

  // Fallback to first module if somehow we don't have a definition
  const fallbackModule = currentModuleDefinition || modules[0];

  const setSelectedModule = (moduleId: ModuleId) => {
    setSelectedModuleState(moduleId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODULE_STORAGE_KEY, moduleId);
    }
  };

  const contextValue: ModuleContextType = {
    selectedModule,
    setSelectedModule,
    currentModuleDefinition: fallbackModule,
    moduleId: selectedModule,
    apiProvider: fallbackModule.apiProvider,
    moduleName: fallbackModule.title,
    moduleDescription: fallbackModule.description,
    moduleRoot: fallbackModule.root,
    modules,
  };

  function AppBootstrap({ children }: { children: React.ReactNode }) {
    const pathname = typeof window === 'undefined' ? '' : window.location.pathname;
    const isPublicWebsiteRoute = pathname === '/' || pathname.startsWith('/shop');
    const [isReady, setIsReady] = useState(false);
    // const attributeDefs = useAttributeDefinitionsBootstrap('LOINC');
    useEffect(() => {
    // This runs AFTER the initial DOM render is complete
    setIsReady(true);
    console.log("React app is fully loaded and mounted!");
  }, []);

    // const isReady = isPublicWebsiteRoute //|| //attributeDefs.isSuccess;

    // if (!isReady) {
    //   return <FullScreenLoader />;
    // }

    return children;
  }

  return (
    <ModuleContext.Provider value={contextValue}>
      <AppBootstrap>{children}</AppBootstrap>
    </ModuleContext.Provider>
  );
}
