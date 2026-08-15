import { useEffect } from 'react';

const moduleTitles: Record<string, string> = {
  rxsoft: 'RxSoft',
  conversation: 'Conversation',
  lis: 'LIS',
  admin: 'Admin Console',
  communication: 'Switch',
  'coding-concept': 'Coding Concept',
  emr: 'EMR',
  damorex: 'Damorex Pharmacy',
  website: 'Website Console',
};

export function useModuleTitle(moduleId: string | undefined) {
  useEffect(() => {
    const title = moduleTitles[moduleId ?? ''] ?? 'RxSoft';
    document.title = title;
  }, [moduleId]);
}
