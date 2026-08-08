import React, { ReactNode, useEffect, useState } from 'react';
import { ModuleContext, type ModuleContextType } from '@/context/module-context';
import { useAttributeDefinitionsBootstrap } from '@/features/queries/bootstrap';
import { modules, type ModuleId, moduleMap } from '@/features/shared/module-data';

const MODULE_STORAGE_KEY = 'rxsoft_admin_selected_module';

const getInitialModule = (): ModuleId => {
  if (typeof window === 'undefined') {
    return 'rxsoft';
  }

  const stored = window.localStorage.getItem(MODULE_STORAGE_KEY);
  if (stored && modules.some((module) => module.id === stored)) {
    return stored as ModuleId;
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
  const [selectedModule, setSelectedModuleState] = useState<ModuleId>(
    defaultModule || getInitialModule()
  );

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
    const isPublicWebsiteRoute = pathname === '/' || pathname.startsWith('/damorex');
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
