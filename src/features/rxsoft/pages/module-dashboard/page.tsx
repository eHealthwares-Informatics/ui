import { Grid, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { RxPage } from '@/features/components/page/rx-page';
import { getModelConfig } from '@/features/registry';
import type { ModelConfig } from '@/features/shared/model-schema';
import { modules } from '@/features/shared/module-data';
import { UserInsightsPanel } from '../user-insights/panel';

/**
 * Per-module landing dashboard: the "My Account & Activity" pane plus quick
 * links into the module's resources. Rendered at /<module>/dashboard for
 * every registered module (module roots in module-data).
 */
export function ModuleDashboardPage({ moduleId }: { moduleId: string }) {
  const mod = modules.find((m) => m.id === moduleId);

  const resources = (mod?.resources ?? []).filter(Boolean);
  const firstResources = resources.slice(0, 6);
  const configs = useQuery({
    queryKey: ['module-dashboard-configs', moduleId, firstResources.join(',')],
    enabled: firstResources.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        firstResources.map(async (r) => [r, await getModelConfig(r).catch(() => null)] as const),
      );
      return Object.fromEntries(entries) as Record<string, ModelConfig | null>;
    },
  });

  if (!mod) {
    return (
      <RxPage title="Unknown module" description={`No module is registered as "${moduleId}".`}>
        <Text c="dimmed">Use the module switcher to pick a workspace.</Text>
      </RxPage>
    );
  }

  return (
    <RxPage title={`${mod.title} Dashboard`} description={mod.description}>
      <Stack gap="lg">
        <UserInsightsPanel />

        {resources.length > 0 ? (
          <Stack gap="sm">
            <Title order={5}>Quick links</Title>
            <Grid>
              {firstResources.map((r) => {
                const label =
                  configs.data?.[r]?.title ??
                  r.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <Grid.Col key={r} span={{ base: 12, sm: 6, md: 4 }}>
                    <Text component="a" href={`/${moduleId}/${r}`} fw={600}>
                      {label}
                    </Text>
                  </Grid.Col>
                );
              })}
            </Grid>
          </Stack>
        ) : null}
      </Stack>
    </RxPage>
  );
}
