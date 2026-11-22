import {
  Box,
  Button,
  Group,
  Loader,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { identityApi } from '@/lib/identity-api';
import { useAuthStore } from '@/stores/auth-store';

const POLL_INTERVAL_MS = 4_000;

type ProvisioningState = {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'not_found';
  stage?: string | null;
  stages?: Array<{ name: string; status: string; error?: string }>;
  error?: string | null;
  organizationCode?: string | null;
};

/**
 * Sidebar marker for an organisation whose async provisioning job is still
 * running (or failed). Onboarding itself polls the job before signing the user
 * in, but a session opened mid-provision (another tab, manual sign-in) would
 * otherwise show partially-populated modules with no explanation.
 *
 * Polls until completed (then renders nothing) or failed (offers a resume).
 */
export function ProvisioningMarker({ collapsed = false }: { collapsed?: boolean }) {
  const organizationId = useAuthStore((state) => state.user?.organizationId ?? null);
  const [state, setState] = useState<ProvisioningState | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!organizationId) {
      setState(null);
      return undefined;
    }

    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const { data } = await identityApi.get<ProvisioningState>('/auth/provisioning');
        if (cancelled) return;
        setState(data);
        if (data.status === 'pending' || data.status === 'running') {
          timer = window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        // Identity unavailable (or the org has no job) — don't block the shell.
        if (!cancelled) setState(null);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [organizationId, reloadKey]);

  const retry = useCallback(async () => {
    const code = state?.organizationCode;
    if (!code) return;
    setRetrying(true);
    try {
      await identityApi.post(`/provision/${encodeURIComponent(code)}/resume`);
      setState((current) => (current ? { ...current, status: 'pending', error: null } : current));
      setReloadKey((key) => key + 1);
    } catch {
      // Keep the failure marker; the user can retry again.
    } finally {
      setRetrying(false);
    }
  }, [state?.organizationCode]);

  if (!state || state.status === 'completed' || state.status === 'not_found') {
    return null;
  }

  const failed = state.status === 'failed';
  const stages = state.stages ?? [];
  const completedStages = stages.filter((stage) => stage.status === 'completed').length;
  const progress = stages.length ? (completedStages / stages.length) * 100 : 0;
  const hint = failed
    ? state.error || 'Setup did not finish. Retry to continue provisioning.'
    : 'Some features may not be available until setup completes — usually a few moments.';

  if (collapsed) {
    return (
      <Tooltip
        label={failed ? 'Provisioning paused — retry in the expanded sidebar' : hint}
        position="right"
        withArrow
        multiline
        w={220}
      >
        <ThemeIcon
          data-testid="sidebar-provisioning-collapsed"
          variant="light"
          color={failed ? 'red' : 'teal'}
          radius="xl"
          size="md"
          mx="auto"
          aria-label={failed ? 'Provisioning paused' : 'Provisioning in progress'}
        >
          {failed ? <AlertTriangle size={16} /> : <Loader size="xs" color="teal" />}
        </ThemeIcon>
      </Tooltip>
    );
  }

  return (
    <Box
      data-testid="sidebar-provisioning"
      mt={6}
      p={8}
      style={{
        border: `1px solid var(--mantine-color-${failed ? 'red' : 'teal'}-3)`,
        background: `var(--mantine-color-${failed ? 'red' : 'teal'}-0)`,
        borderRadius: 8,
      }}
    >
      <Stack gap={6}>
        <Group gap={6} wrap="nowrap" align="center">
          {failed ? (
            <AlertTriangle size={14} color="var(--mantine-color-red-6)" />
          ) : (
            <Loader size={12} color="var(--mantine-color-teal-6)" />
          )}
          <Text size="xs" fw={700} c={failed ? 'red.7' : 'teal.8'}>
            {failed ? 'Provisioning paused' : 'Provisioning'}
          </Text>
        </Group>

        <Text size="10px" c="dimmed" lh={1.35}>
          {hint}
        </Text>

        {!failed && (
          <Progress
            value={progress}
            size={4}
            radius="xl"
            color="teal"
            animated
            striped
            aria-label="Provisioning progress"
          />
        )}

        {failed && state.organizationCode && (
          <Button
            size="compact-xs"
            variant="light"
            color="red"
            loading={retrying}
            onClick={() => void retry()}
            data-testid="sidebar-provisioning-retry"
          >
            Retry
          </Button>
        )}
      </Stack>
    </Box>
  );
}
