import { useEffect } from 'react';

const moduleFavicons: Record<string, string> = {
  rxsoft: '/src/favicons/rxsoft.svg',
  conversation: '/src/favicons/conversation.svg',
  lis: '/src/favicons/lis.svg',
  admin: '/src/favicons/admin.svg',
  communication: '/src/favicons/rxsoft.svg',
  'coding-concept': '/src/favicons/admin.svg',
  emr: '/src/favicons/emr.svg',
  website: '/src/favicons/rxsoft.svg',
};

export function useModuleFavicon(moduleId: string | undefined) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      return;
    }
    const favicon = moduleFavicons[moduleId ?? ''] ?? moduleFavicons.admin;
    link.href = favicon;
  }, [moduleId]);
}
