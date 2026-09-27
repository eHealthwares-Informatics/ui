import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthenticatedLayout } from '@/layout/authenticated-layout';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: ({ location }) => {
    useAuthStore.getState().bootstrap();
    if (!useAuthStore.getState().user) {
      // NOTE: `location.search` here is the PARSED search object (no prototype,
      // not stringifiable) — string-concatting it throws
      // "Cannot convert object to primitive value" and crashes the guard so
      // unauthenticated deep links never reach /sign-in. Use searchStr.
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.pathname + location.searchStr },
      });
    }
  },
});
