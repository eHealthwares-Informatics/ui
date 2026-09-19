import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Menu,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, MoreHorizontal, Wrench } from 'lucide-react';
import { useMemo } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { emrApi } from '@/lib/emr-api';
import { StatusBadge } from '../../components/shared/status-badge';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { Admission, Bed, Ward } from '../../lib/emr-types';

type BedStatus = Bed['status'];

const STATUS_COLOR: Record<BedStatus, string> = {
  AVAILABLE: 'teal',
  OCCUPIED: 'blue',
  MAINTENANCE: 'yellow',
  OUT_OF_SERVICE: 'red',
};

export function BedAllocationsPage() {
  const queryClient = useQueryClient();

  const { data: wardsData = [] } = useQuery({
    queryKey: ['emr', 'wards'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Ward[] }>('/wards', { params: { limit: 100 } });
      return res.data.data;
    },
  });
  const { data: bedsData = [] } = useQuery({
    queryKey: ['emr', 'beds'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Bed[] }>('/beds', { params: { limit: 300 } });
      return res.data.data;
    },
  });
  const { data: admissionsData = [] } = useQuery({
    queryKey: ['emr', 'admissions', 'active'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Admission[] }>('/admissions', {
        params: { limit: 200, status: 'ADMITTED' },
      });
      return res.data.data;
    },
  });

  const occupantByBed = useMemo(() => {
    const map = new Map<string, Admission>();
    for (const admission of admissionsData) {
      if (admission.bedId) {
        map.set(admission.bedId, admission);
      }
    }
    return map;
  }, [admissionsData]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { AVAILABLE: 0, OCCUPIED: 0, MAINTENANCE: 0, OUT_OF_SERVICE: 0 };
    for (const bed of bedsData) {
      counts[bed.status] = (counts[bed.status] ?? 0) + 1;
    }
    return counts;
  }, [bedsData]);

  const wards = [...wardsData].sort((a, b) => a.name.localeCompare(b.name));

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BedStatus }) => {
      const { data } = await emrApi.patch(`/beds/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Bed status updated', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'beds'] });
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  return (
    <RxPage
      breadcrumbs={[{ label: 'EMR' }, { label: 'Wards' }, { label: 'Bed Allocations' }]}
      title="Bed Allocations"
      description="Live board of ward beds and their occupancy."
    >
      <Stack gap="lg">
        <Group gap="md">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge key={status} color={STATUS_COLOR[status as BedStatus]} variant="light" size="lg">
              {status.replace(/_/g, ' ')}: {count}
            </Badge>
          ))}
        </Group>

        {wards.length === 0 ? (
          <Card withBorder radius="md" padding="lg">
            <Text size="sm" c="dimmed">
              No wards yet — create a ward to start allocating beds.
            </Text>
          </Card>
        ) : (
          wards.map((ward) => {
            const beds = bedsData
              .filter((bed) => bed.wardId === ward.id)
              .sort((a, b) => a.code.localeCompare(b.code));
            return (
              <Card key={ward.id} withBorder radius="md" padding="lg">
                <Group justify="space-between" mb="sm">
                  <Stack gap={2}>
                    <Group gap="xs">
                      <Badge variant="light">{ward.code}</Badge>
                      <Title order={4}>{ward.name}</Title>
                      <StatusBadge value={ward.wardType} kind="wardType" />
                    </Group>
                    <Text size="xs" c="dimmed">
                      {beds.length} beds · {beds.filter((b) => b.status === 'AVAILABLE').length}{' '}
                      available · {beds.filter((b) => b.status === 'OCCUPIED').length} occupied
                    </Text>
                  </Stack>
                </Group>

                {beds.length === 0 ? (
                  <Text size="xs" c="dimmed">
                    No beds in this ward yet.
                  </Text>
                ) : (
                  <SimpleGrid cols={{ base: 2, sm: 3, lg: 4, xl: 6 }} spacing="sm">
                    {beds.map((bed) => {
                      const occupant = occupantByBed.get(bed.id);
                      return (
                        <Card
                          key={bed.id}
                          withBorder
                          radius="md"
                          padding="sm"
                          style={{ borderColor: `var(--mantine-color-${STATUS_COLOR[bed.status]}-4)` }}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap={6} wrap="nowrap">
                              <Wrench size={13} color="var(--mantine-color-dimmed)" />
                              <Text size="sm" fw={600}>
                                {bed.code}
                              </Text>
                            </Group>
                            <Menu position="bottom-end" withinPortal>
                              <Menu.Target>
                                <ActionIcon size="sm" variant="subtle" aria-label="Bed status menu">
                                  <MoreHorizontal size={14} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Set status</Menu.Label>
                                {(['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'] as BedStatus[]).map(
                                  (status) => (
                                    <Menu.Item
                                      key={status}
                                      leftSection={
                                        status === 'AVAILABLE' ? (
                                          <ChevronDown size={14} />
                                        ) : (
                                          <Wrench size={14} />
                                        )
                                      }
                                      disabled={bed.status === status}
                                      onClick={() => setStatus.mutate({ id: bed.id, status })}
                                    >
                                      {status.replace(/_/g, ' ')}
                                    </Menu.Item>
                                  ),
                                )}
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                          <Group gap={6} mt={4} wrap="nowrap">
                            <StatusBadge value={bed.status} kind="bedStatus" />
                            <StatusBadge value={bed.bedType} kind="bedType" />
                          </Group>
                          {bed.status === 'OCCUPIED' && occupant ? (
                            <Text size="xs" fw={500} mt={4} lineClamp={1}>
                              {occupant.patientName || occupant.patientId}
                            </Text>
                          ) : (
                            <Text size="xs" c="dimmed" mt={4}>
                              {bed.notes ?? 'Unoccupied'}
                            </Text>
                          )}
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                )}
              </Card>
            );
          })
        )}
      </Stack>
    </RxPage>
  );
}