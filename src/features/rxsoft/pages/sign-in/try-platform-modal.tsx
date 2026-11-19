import {
  Alert,
  Box,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { ChevronRight, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { DEMO_ACCOUNTS, demoAccountFor } from '@/features/shared/demo-modules';
import type { ModuleId } from '@/features/shared/module-data';
import { moduleCards, moduleCardFallbackIcons, modulePlans } from '@/features/shared/module-meta';
import { getModuleDashboard } from '@/lib/module-routing';
import { useAuthStore } from '@/stores/auth-store';

type TryPlatformModalProps = {
  opened: boolean;
  onClose: () => void;
};

const DEMO_ORDER: ModuleId[] = [
  'rxsoft',
  'emr',
  'lis',
  'conversation',
  'communication',
  'coding-concept',
  'identity',
  'admin',
  'website',
];

/**
 * "Try our platform" chooser on the sign-in page.
 *
 * Mirrors the `/modules` landing grid, but each card signs in with the seeded
 * demo account for that module (DEFAULT organisation + module-admin role) and
 * lands on the module dashboard. The accounts share the DEFAULT org's data —
 * exactly what a prospect should see.
 */
export function TryPlatformModal({ opened, onClose }: TryPlatformModalProps) {
  const login = useAuthStore((state) => state.login);
  const [busy, setBusy] = useState<ModuleId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openModule = async (moduleId: ModuleId) => {
    if (busy) return;
    const account = demoAccountFor(moduleId);
    if (!account) {
      setError('This module has no demo account configured.');
      return;
    }

    setBusy(moduleId);
    setError(null);
    try {
      await login(account.username, account.password);
      if (!useAuthStore.getState().user) {
        setError(
          'Demo account is not available yet. Seed the DEFAULT organisation (npm run seed -- --target identity) and try again.'
        );
        return;
      }
      window.location.href = getModuleDashboard(moduleId);
    } catch {
      setError('Could not start the demo. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group gap="xs">
          <FlaskConical size={20} color="#10B981" />
          <Text fw={700} size="lg" data-testid="try-platform-title">
            Try our platform
          </Text>
        </Group>
      }
      styles={{ body: { paddingTop: 8 } }}
    >
      <Stack gap="md" data-testid="try-platform-modal">
        <Text size="sm" style={{ color: '#64748B' }}>
          Pick a module to explore it with a demo account. Each demo signs you in with that
          module&apos;s admin role and shares the default organisation&apos;s sample data.
        </Text>

        {error && (
          <Alert color="red" variant="light" data-testid="try-platform-error">
            {error}
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" verticalSpacing="sm">
          {DEMO_ORDER.map((moduleId) => {
            const account = demoAccountFor(moduleId);
            if (!account) return null;
            const meta = moduleCards[moduleId];
            const FallbackIcon = moduleCardFallbackIcons[moduleId];
            const title = meta?.title ?? modulePlans[moduleId] ?? moduleId;
            const isBusy = busy === moduleId;

            return (
              <UnstyledButton
                key={moduleId}
                data-testid={`try-platform-module-${moduleId}`}
                onClick={() => void openModule(moduleId)}
                disabled={busy !== null}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: 14,
                  background: isBusy ? '#F0FDFA' : 'white',
                  opacity: busy !== null && !isBusy ? 0.6 : 1,
                  textAlign: 'left',
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    <Box
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: '#F0FDFA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {meta?.icon ? (
                        <img
                          src={meta.icon}
                          alt=""
                          aria-hidden="true"
                          style={{ width: 26, height: 26, objectFit: 'contain' }}
                        />
                      ) : FallbackIcon ? (
                        <FallbackIcon size={22} strokeWidth={1.8} color="#0F766E" />
                      ) : null}
                    </Box>
                    <Box>
                      <Text fw={600} size="sm" style={{ color: '#0F172A' }}>
                        {title}
                      </Text>
                      <Text
                        size="xs"
                        style={{ color: '#64748B' }}
                        data-testid={`try-platform-module-${moduleId}-description`}
                      >
                        {modulePlans[moduleId] ?? moduleId}
                      </Text>
                    </Box>
                  </Group>
                  {isBusy ? (
                    <Loader size="xs" color="#10B981" />
                  ) : (
                    <ChevronRight size={16} color="#94A3B8" aria-hidden="true" />
                  )}
                </Group>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>

        <Text size="xs" style={{ color: '#9CA3AF' }}>
          {Object.keys(DEMO_ACCOUNTS).length} modules available. Demo sessions use the default
          organisation, so changes you make are shared and can be reset by re-seeding.
        </Text>
      </Stack>
    </Modal>
  );
}
