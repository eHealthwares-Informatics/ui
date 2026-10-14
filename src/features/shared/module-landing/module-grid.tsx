import { Card, Group, SimpleGrid, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { useSetSelectedModule } from '@/context/module-context';
import type { ModuleId } from '@/features/shared/module-data';
import { moduleIcons, modulePlans } from '@/features/shared/module-meta';
import { getModuleDashboard } from '@/lib/module-routing';
import type { ModuleInfo } from '@/stores/auth-store';

type ModuleGridProps = {
  modules: ModuleInfo[];
  /** Test seam: invoked with the chosen module id (navigation is stubbed in tests). */
  onSelect?: (moduleId: ModuleId) => void;
};

/**
 * Presentational grid of the modules available to the signed-in user
 * (ROLE-level enforcement: the list comes from identity's permission-derived
 * getUserModules via /auth/me — users only ever see modules their
 * permissions grant).
 */
export function ModuleGrid({ modules, onSelect }: ModuleGridProps) {
  const navigate = useNavigate();
  const setSelectedModuleId = useSetSelectedModule();

  const handleSelect = (moduleId: string) => {
    setSelectedModuleId(moduleId as ModuleId);
    onSelect?.(moduleId as ModuleId);
    navigate({ to: getModuleDashboard(moduleId as ModuleId) });
  };

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" data-testid="module-grid">
      {modules.map((mod) => {
        const Icon = moduleIcons[mod.id];
        return (
          <UnstyledButton
            key={mod.id}
            onClick={() => handleSelect(mod.id)}
            w="100%"
            data-testid={`module-card-${mod.id}`}
          >
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
              <Group justify="space-between" mb="md">
                <ThemeIcon size={44} radius="md" variant="light">
                  {Icon ? <Icon size={24} /> : null}
                </ThemeIcon>
                <ArrowRight size={18} />
              </Group>
              <Stack gap={2}>
                <Text fw={600} size="lg" data-testid={`module-card-${mod.id}-title`}>
                  {mod.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {modulePlans[mod.id] || mod.description}
                </Text>
              </Stack>
            </Card>
          </UnstyledButton>
        );
      })}
    </SimpleGrid>
  );
}
