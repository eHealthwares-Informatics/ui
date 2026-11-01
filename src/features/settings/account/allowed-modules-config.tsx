import { Card, Group, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { Boxes, ChevronRight } from 'lucide-react';
import type { ModuleId } from '@/features/shared/module-data';
import { getModuleDashboard } from '@/lib/module-routing';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Lists the modules the signed-in account is allowed to access (identity's
 * permission-derived module list from /auth/me) and links into each module's
 * dashboard, where its configuration lives.
 */
export function AllowedModulesConfig() {
  const modules = useAuthStore((s) => s.modules);
  const navigate = useNavigate();
  const go = (path: string) =>
    (navigate as unknown as (opts: { to: string }) => void)({ to: path });

  return (
    <Card withBorder radius="md" p="lg" data-testid="account-allowed-modules">
      <Stack gap="sm">
        <Group gap="sm" align="flex-start" wrap="nowrap">
          <ThemeIcon radius="xl" size={30} color="teal" variant="light">
            <Boxes size={16} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={700}>Config for allowed modules</Text>
            <Text size="xs" c="dimmed">
              Modules your account is permitted to use. Open one to manage its configuration.
            </Text>
          </Stack>
        </Group>

        {modules.length === 0 ? (
          <Text size="sm" c="dimmed">
            No modules are enabled for your account. Ask an administrator for access.
          </Text>
        ) : (
          <Stack gap={6}>
            {modules.map((mod) => (
              <UnstyledButton
                key={mod.id}
                onClick={() => go(getModuleDashboard(mod.id as ModuleId))}
                data-testid={`allowed-module-${mod.id}`}
                style={{
                  borderRadius: 10,
                  padding: '10px 12px',
                  border: '1px solid var(--mantine-color-gray-3)',
                }}
              >
                <Group justify="space-between" wrap="nowrap" gap="sm">
                  <div style={{ minWidth: 0 }}>
                    <Text fw={600} size="sm">
                      {mod.name}
                    </Text>
                    {mod.description ? (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {mod.description}
                      </Text>
                    ) : null}
                  </div>
                  <ChevronRight size={16} />
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
