import { SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  DashboardCard,
  DashboardCardTitle,
  DashboardHero,
  DashboardPage,
} from '@/features/components/dashboard/dashboard-surface';
import { ArrowUpRight } from 'lucide-react';
import {
  getModelConfig,
} from '@/features/registry';
import type { ModelConfig } from '@/features/shared/model-schema';
import { modules } from '@/features/shared/module-data';
import { moduleAccentTones, moduleCards } from '@/features/shared/module-meta';
import { UserInsightsPanel } from '../user-insights/panel';

export function ModuleDashboardPage({ moduleId }: { moduleId: string }) {
  const mod = modules.find((m) => m.id === moduleId);

  const resources = (mod?.resources ?? []).filter(Boolean);
  const firstResources = resources.slice(0, 6);
  const configs = useQuery({
    queryKey: ['module-dashboard-configs', moduleId, firstResources.join(',')],
    enabled: firstResources.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        firstResources.map(async (r) => [r, await getModelConfig(r).catch(() => null)] as const)
      );
      return Object.fromEntries(entries) as Record<string, ModelConfig | null>;
    },
  });

  if (!mod) {
    return (
      <DashboardPage testId="module-dashboard-unknown">
        <DashboardHero
          eyebrow="Module"
          title="Unknown module"
          subtitle={`No module is registered as "${moduleId}". Use the module switcher to pick a workspace.`}
        />
      </DashboardPage>
    );
  }

  const meta = moduleCards[mod.id];
  const tone = meta ? moduleAccentTones[meta.accent] : 'brand';

  return (
    <DashboardPage testId="module-dashboard">
      <DashboardHero
        eyebrow={mod.title}
        title={`${mod.title} dashboard`}
        subtitle={meta?.description ?? mod.description}
      />
      <Stack gap="lg">
        <UserInsightsPanel />

        {resources.length > 0 ? (
          <Stack gap="sm">
            <DashboardCardTitle hint={`${resources.length} resources`}>Quick links</DashboardCardTitle>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {firstResources.map((r) => {
                const label =
                  configs.data?.[r]?.title ??
                  r.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                const description = configs.data?.[r]?.description;
                return (
                  <DashboardCard
                    key={r}
                    tone={tone}
                    padding="md"
                    href={`/${moduleId}/${r}`}
                    testId={`module-quick-link-${r}`}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <Stack gap={2}>
                        <Text fw={700} size="sm">
                          {label}
                        </Text>
                        {description ? (
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {description}
                          </Text>
                        ) : null}
                      </Stack>
                      <ThemeIcon radius="xl" size={26} variant="light" color={tone}>
                        <ArrowUpRight size={14} />
                      </ThemeIcon>
                    </div>
                  </DashboardCard>
                );
              })}
            </SimpleGrid>
          </Stack>
        ) : null}
      </Stack>
    </DashboardPage>
  );
}
