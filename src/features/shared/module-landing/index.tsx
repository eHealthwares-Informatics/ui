import { Box, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { greetingNameOf } from '@/lib/user-name';
import { useAuthStore } from '@/stores/auth-store';
import { ModuleGrid } from './module-grid';
import classes from './index.module.css';

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

/**
 * Post-login default landing: a grid of the modules available to the signed-in
 * user (icons + descriptions). Signed-in users land here when no redirect URL
 * was requested and they hold more than one module; picking a card switches
 * the module context and navigates to that module's dashboard.
 */
export function ModuleLandingPage() {
  const user = useAuthStore((state) => state.user);
  const modules = useAuthStore((state) => state.modules);
  const fetchModules = useAuthStore((state) => state.fetchModules);
  // Distinguishes "still fetching" from "fetched and genuinely empty".
  const [fetchSettled, setFetchSettled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (user && modules.length === 0) {
      void fetchModules().finally(() => {
        if (!cancelled) {
          setFetchSettled(true);
        }
      });
    } else {
      setFetchSettled(true);
    }
    return () => {
      cancelled = true;
    };
  }, [user, modules.length, fetchModules]);

  if (!user) {
    return null;
  }

  const showEmptyState = fetchSettled && modules.length === 0;

  return (
    <Box p="xl" maw={1100} mx="auto" w="100%" data-testid="module-landing">
      <Stack gap="lg">
        <Title order={1} className={classes.greeting} data-testid="module-landing-title">
          {greetingFor(new Date())}, {greetingNameOf(user)}
          <span className={classes.wave} aria-hidden="true">
            👋
          </span>
        </Title>
        <Text className={classes.subtitle} data-testid="module-landing-subtitle">
          Welcome to RxSoft. Choose a module to get started.
        </Text>

        {showEmptyState ? (
          <Center h={200}>
            <Stack align="center" gap="xs" data-testid="module-landing-empty">
              <Text size="sm" c="dimmed">
                No modules are available for your account. Contact your administrator if you
                expected access.
              </Text>
            </Stack>
          </Center>
        ) : modules.length === 0 ? (
          <Center h={200}>
            <Stack align="center" gap="xs">
              <Loader size="sm" data-testid="module-landing-loader" />
              <Text size="sm" c="dimmed">
                Loading your modules…
              </Text>
            </Stack>
          </Center>
        ) : (
          <ModuleGrid modules={modules} />
        )}
      </Stack>
    </Box>
  );
}
