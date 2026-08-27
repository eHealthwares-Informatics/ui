import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
// Styles
// import './styles/index.css'
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { notifications } from '@mantine/notifications';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import axios, { AxiosError } from 'axios';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { handleServerError } from '@/lib/handle-server-error';
import { getDefaultRoute } from '@/lib/subdomain';
import { useAuthStore } from '@/stores/auth-store';
import { FontProvider } from './context/font-provider';
import { ModuleProvider } from './context/module-provider';
import { ThemeProvider } from './context/theme-provider';
import { ViewProvider } from './context/view-provider';
// import { DirectionProvider } from './context/direction-provider'
// import { FontProvider } from './context/font-provider'
// Generated Routes
import { routeTree } from './routeTree.gen';
// import './styles/tailwind-fallback.css'

Sentry.init({
   dsn: "https://5eab9ae2db7f91247e0cc2e33f9b3cab@o4511611278000128.ingest.us.sentry.io/4511611282259968",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: []
  },
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.,
  // Enable logs to be sent to Sentry
  enableLogs: true
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) {console.log({ failureCount, error });}

        if (failureCount >= 0 && import.meta.env.DEV) {return false;}
        if (failureCount > 3 && import.meta.env.PROD) {return false;}

        return !(error instanceof AxiosError && [401, 403].includes(error.response?.status ?? 0));
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error);

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            notifications.show({
              title: 'Status',
              message: 'Content not modified!',
              color: 'yellow',
            });
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          notifications.show({ title: 'Session expired!', message: error.message, color: 'red' });
          useAuthStore.getState().logout();
          const redirect = `${router.history.location.href}`;
          router.navigate({ to: '/sign-in', search: { redirect } });
        }
        if (error.response?.status === 500) {
          notifications.show({ title: 'Server Error', message: error.message, color: 'red' });
          // Only navigate to error page in production to avoid disrupting HMR in development
          if (import.meta.env.PROD) {
            router.navigate({ to: '/500' });
          }
        }
        if (error.response?.status === 403) {
          router.navigate({ to: '/403', replace: true });
        }
      }
    },
  }),
});

// Subdomain-aware redirect: if landing on /, go to subdomain default
if (window.location.pathname === '/' || window.location.pathname === '') {
  const defaultRoute = getDefaultRoute();
  if (defaultRoute !== '/') {
    window.history.replaceState({}, '', defaultRoute);
  }
}

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <ThemeProvider>
            <FontProvider>
              <ModuleProvider>
                <ViewProvider>
                  <RouterProvider router={router} />
                </ViewProvider>
              </ModuleProvider>
            </FontProvider>
          </ThemeProvider>
        </MantineProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
