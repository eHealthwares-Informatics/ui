import { Notifications } from '@mantine/notifications';
import { type QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { NavigationProgress } from '@/components/navigation-progress';
import { GeneralError } from '@/features/errors/general-error';
import { NotFoundError } from '@/features/errors/not-found-error';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: () => {
    return (
      <>
        <NavigationProgress />
        <Outlet />
        <Notifications />
        {/* React Query devtools: hidden for automated browsers (navigator.webdriver)
            so the floating panel can never intercept pointer events in e2e runs. */}
        {import.meta.env.MODE === 'development' && !navigator.webdriver && (
          <ReactQueryDevtools buttonPosition="bottom-right" />
        )}
      </>
    );
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
});
