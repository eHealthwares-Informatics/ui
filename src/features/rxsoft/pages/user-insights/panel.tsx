import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Grid,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Clock4,
  HandCoins,
  KeyRound,
  ShieldCheck,
  UserRound,
  ScrollText,
} from 'lucide-react';
import {
  createRoleRequest,
  getMe,
  getMeActivity,
  getMyAudit,
  getMyPosConfig,
  listMyRoleRequests,
  listRoleCatalog,
} from './api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

function timeAgo(value: string | null | undefined): string {
  if (!value) {return '—';}
  const then = new Date(value).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) {return 'just now';}
  if (m < 60) {return `${m}m ago`;}
  const h = Math.floor(m / 60);
  if (h < 24) {return `${h}h ago`;}
  return `${Math.floor(h / 24)}d ago`;
}

function formatDt(value: string | null | undefined): string {
  if (!value) {return '—';}
  return new Date(value).toLocaleString();
}

function CardHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Group gap={8} mb="xs">
      {icon}
      <Text fw={800} size="sm" tt="uppercase" c="dimmed">
        {label}
      </Text>
    </Group>
  );
}

export function UserInsightsPanel() {
  const qc = useQueryClient();
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const me = useQuery({ queryKey: ['me-profile'], queryFn: getMe });
  const activity = useQuery({ queryKey: ['me-activity'], queryFn: getMeActivity });
  const config = useQuery({ queryKey: ['me-pos-config'], queryFn: getMyPosConfig });
  const audit = useQuery({ queryKey: ['me-audit'], queryFn: () => getMyAudit(6) });
  const roleCatalog = useQuery({ queryKey: ['role-catalog'], queryFn: listRoleCatalog });
  const myRequests = useQuery({ queryKey: ['role-requests-mine'], queryFn: listMyRoleRequests });

  const requestRole = useMutation({
    mutationFn: () => createRoleRequest(pendingRole ?? '', reason.trim() || undefined),
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Role request submitted' });
      setPendingRole(null);
      setReason('');
      qc.invalidateQueries({ queryKey: ['role-requests-mine'] });
    },
    onError: (e: any) =>
      notifications.show({
        color: 'red',
        message: getApiErrorMessage(e),
        }),
  });

  const profile = me.data;
  const currentRoles = profile?.roles ?? [];
  const requestable = (roleCatalog.data ?? []).filter((r) => !currentRoles.includes(r.code));

  return (
    <Card withBorder radius="md" p="md" mb="lg">
      <Group justify="space-between" mb="xs">
        <Title order={5}>My Account & Activity</Title>
        <Text size="xs" c="dimmed">
          {profile?.username ?? '...'}
        </Text>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Box>
            <CardHeading icon={<Clock4 size={16} />} label="Session" />
            <Stack gap={2}>
              <Text size="sm">Last login: <b>{formatDt(activity.data?.lastLoginAt)}</b></Text>
              <Text size="sm" c="dimmed">({timeAgo(activity.data?.lastLoginAt)})</Text>
              <Text size="sm">Logins: <b>{activity.data?.loginCount ?? 0}</b></Text>
              <Text size="sm">Refreshes: <b>{activity.data?.refreshCount ?? 0}</b></Text>
            </Stack>
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <Box>
            <CardHeading icon={<UserRound size={16} />} label="User" />
            <Stack gap={2}>
              <Text size="sm" fw={600}>{profile?.username}</Text>
              <Group gap={4}>
                {currentRoles.map((r) => (
                  <Badge key={r} size="sm" variant="light" color="green">
                    {r}
                  </Badge>
                ))}
              </Group>
            </Stack>
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <Box>
            <CardHeading icon={<KeyRound size={16} />} label="Access" />
            <Text size="xs" c="dimmed" mb={4}>
              {(profile?.permissions ?? []).length} permission(s) via roles
            </Text>
            <Text size="xs" lineClamp={3} c="dimmed">
              {(profile?.permissions ?? []).slice(0, 12).join(', ')}
              {(profile?.permissions ?? []).length > 12 ? '…' : ''}
            </Text>
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <Box>
            <CardHeading icon={<HandCoins size={16} />} label="Config" />
            <Stack gap={2}>
              <Text size="sm">POS access: <b>{config.data?.allowPos ? 'Yes' : 'No'}</b></Text>
              <Text size="sm">A4 print: <b>{config.data?.allowA4Print ? 'Yes' : 'No'}</b></Text>
              <Text size="sm">Store: <b>{config.data?.storeId || 'default'}</b></Text>
              <Text size="sm">
                Location:{' '}
                <b>{config.data?.stockLocation?.name ?? '—'}</b>
              </Text>
            </Stack>
          </Box>
        </Grid.Col>
      </Grid>

      <Divider my="sm" />

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <CardHeading icon={<ScrollText size={16} />} label="My audit trail" />
          {audit.isError ? (
            <Text size="xs" c="orange">
              Audit trail unavailable — the reporting backend is offline.
            </Text>
          ) : (
            <>
              <Text size="xs" c="dimmed" mb={4}>
                {audit.data?.meta?.total ?? 0} event(s) logged
              </Text>
              <Stack gap={2}>
                {(audit.data?.data ?? []).slice(0, 4).map((ev: any) => (
                  <Text key={ev.id} size="xs" c="dimmed" lineClamp={1}>
                    {ev.action} · {ev.httpPath} · {timeAgo(ev.createdAt)}
                  </Text>
                ))}
              </Stack>
            </>
          )}
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <CardHeading icon={<ShieldCheck size={16} />} label="Roles & permission requests" />
          <Text size="xs" c="dimmed" mb={4}>
            Request a role you don't have yet
          </Text>
          <Group gap="sm" align="flex-end">
            <Select
              size="xs"
              placeholder="Choose a role…"
              data={requestable.map((r) => ({ value: r.code, label: r.name || r.code }))}
              value={pendingRole}
              onChange={setPendingRole}
              searchable
              nothingFoundMessage="No other roles available"
              style={{ flex: 1 }}
            />
            <TextInput
              size="xs"
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Button size="xs" onClick={() => requestRole.mutate()} loading={requestRole.isPending}>
              Request
            </Button>
          </Group>
          <Stack gap={2} mt="xs">
            {(myRequests.data ?? []).slice(0, 3).map((req) => (
              <Text key={req.id} size="xs" c="dimmed" lineClamp={1}>
                {req.roleCode} → {req.status}
              </Text>
            ))}
          </Stack>
        </Grid.Col>
      </Grid>
    </Card>
  );
}