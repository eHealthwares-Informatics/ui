import {
  Badge,
  Card,
  Divider,
  Grid,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { RxPage } from '@/features/components/page/rx-page';
import { codingConceptApi } from '@/lib/coding-concept-api';

type GeoRef = { code: string; name: string } | null;

type Laboratory = {
  id: string;
  code: string;
  name: string | null;
  address: string | null;
  description: string | null;
  openHours: string | null;
  rating: string | null;
  sourceUrl: string | null;
  state: GeoRef;
  lga: GeoRef;
};

type NearbyLaboratory = Laboratory & {
  nearbyTier: string;
};

const TIER_LABEL: Record<string, string> = {
  lga: 'Same LGA',
  state: 'Same state',
};

function refName(ref: GeoRef) {
  return ref?.name ?? '—';
}

export function CodedLaboratoryDetailPage({ laboratoryId }: { laboratoryId: string }) {
  const laboratory = useQuery({
    queryKey: ['coding-concept', 'laboratories', laboratoryId] satisfies QueryKey,
    queryFn: async () => {
      const response = await codingConceptApi.get(`/diagnostic-centers/${laboratoryId}`);
      return response.data.data as Laboratory;
    },
  });

  const nearby = useQuery({
    queryKey: ['coding-concept', 'laboratories', laboratoryId, 'nearby'] satisfies QueryKey,
    queryFn: async () => {
      const response = await codingConceptApi.get(`/diagnostic-centers/${laboratoryId}/nearby`, {
        params: { limit: 50 },
      });
      return response.data.data as NearbyLaboratory[];
    },
  });

  return (
    <RxPage
      title={laboratory.data?.name ?? 'Laboratory'}
      description={laboratory.data?.address ?? laboratory.data?.code ?? ''}
    >
      <Stack gap="lg">
        <Card withBorder radius="lg" p="lg">
          {laboratory.isLoading && <Loader size="sm" />}
          {laboratory.isError && (
            <Text size="sm" c="red">
              Failed to load laboratory.
            </Text>
          )}
          {laboratory.data && (
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={3}>{laboratory.data.name ?? '—'}</Title>
                {laboratory.data.rating ? (
                  <Badge variant="light">★ {laboratory.data.rating}</Badge>
                ) : null}
              </Group>
              <Text size="sm" c="dimmed">
                {laboratory.data.code}
              </Text>
              <Divider />
              <Grid>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    State
                  </Text>
                  <Text fw={500}>{refName(laboratory.data.state)}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    LGA
                  </Text>
                  <Text fw={500}>{refName(laboratory.data.lga)}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Open hours
                  </Text>
                  <Text fw={500}>{laboratory.data.openHours ?? '—'}</Text>
                </Grid.Col>
              </Grid>
              {laboratory.data.description ? (
                <Text size="sm">{laboratory.data.description}</Text>
              ) : null}
            </Stack>
          )}
        </Card>

        <Card withBorder radius="lg" p="lg">
          <Stack gap="md">
            <Group gap="sm">
              <Title order={4}>Nearby laboratories</Title>
              <Badge variant="light" color="gray">
                {nearby.data?.length ?? 0}
              </Badge>
            </Group>
            <Divider />
            {nearby.isLoading && <Loader size="sm" />}
            {nearby.isError && (
              <Text size="sm" c="red">
                Failed to load nearby laboratories.
              </Text>
            )}
            {nearby.data && nearby.data.length === 0 && (
              <Text size="sm" c="dimmed">
                No nearby laboratories found.
              </Text>
            )}
            {nearby.data && nearby.data.length > 0 && (
              <Table.ScrollContainer minWidth={640}>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>LGA</Table.Th>
                      <Table.Th>Proximity</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {nearby.data.map((row) => (
                      <Table.Tr key={row.id}>
                        <Table.Td>
                          <Text
                            component={Link}
                            to={`/coding-concept/facilities/laboratories/${row.id}`}
                            size="sm"
                            fw={500}
                          >
                            {row.name ?? '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>{refName(row.lga)}</Table.Td>
                        <Table.Td>{TIER_LABEL[row.nearbyTier] ?? row.nearbyTier}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Stack>
        </Card>
      </Stack>
    </RxPage>
  );
}
