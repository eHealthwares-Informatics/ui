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

type Hospital = {
  id: string;
  facilityId: string;
  facilityName: string | null;
  latitude: number | null;
  longitude: number | null;
  phoneNumber: string | null;
  emailAddress: string | null;
  website: string | null;
  state: GeoRef;
  lga: GeoRef;
  ward: GeoRef;
  facilityType: GeoRef;
  facilityLevel: GeoRef;
};

type NearbyHospital = {
  id: string;
  facilityName: string | null;
  facilityLevel: GeoRef;
  ward: GeoRef;
  lga: GeoRef;
  distanceKm: number;
};

function refName(ref: GeoRef) {
  return ref?.name ?? '—';
}

export function CodedHospitalDetailPage({ hospitalId }: { hospitalId: string }) {
  const hospital = useQuery({
    queryKey: ['coding-concept', 'hospitals', hospitalId] satisfies QueryKey,
    queryFn: async () => {
      const response = await codingConceptApi.get(`/facilities/${hospitalId}`);
      return response.data.data as Hospital;
    },
  });

  const nearby = useQuery({
    queryKey: ['coding-concept', 'hospitals', hospitalId, 'nearby'] satisfies QueryKey,
    queryFn: async () => {
      const response = await codingConceptApi.get(`/facilities/${hospitalId}/nearby`, {
        params: { limit: 50, nameLike: 'hospital' },
      });
      return response.data.data as NearbyHospital[];
    },
  });

  return (
    <RxPage
      title={hospital.data?.facilityName ?? 'Hospital'}
      description={hospital.data?.facilityId ?? ''}
    >
      <Stack gap="lg">
        <Card withBorder radius="lg" p="lg">
          {hospital.isLoading && <Loader size="sm" />}
          {hospital.isError && (
            <Text size="sm" c="red">
              Failed to load hospital.
            </Text>
          )}
          {hospital.data && (
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={3}>{hospital.data.facilityName ?? '—'}</Title>
                <Badge variant="light">{refName(hospital.data.facilityLevel)}</Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {hospital.data.facilityId}
              </Text>
              <Divider />
              <Grid>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Type
                  </Text>
                  <Text fw={500}>{refName(hospital.data.facilityType)}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Phone
                  </Text>
                  <Text fw={500}>{hospital.data.phoneNumber ?? '—'}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Email
                  </Text>
                  <Text fw={500}>{hospital.data.emailAddress ?? '—'}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    State
                  </Text>
                  <Text fw={500}>{refName(hospital.data.state)}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    LGA
                  </Text>
                  <Text fw={500}>{refName(hospital.data.lga)}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Ward
                  </Text>
                  <Text fw={500}>{refName(hospital.data.ward)}</Text>
                </Grid.Col>
              </Grid>
            </Stack>
          )}
        </Card>

        <Card withBorder radius="lg" p="lg">
          <Stack gap="md">
            <Group gap="sm">
              <Title order={4}>Nearby hospitals</Title>
              <Badge variant="light" color="gray">
                {nearby.data?.length ?? 0}
              </Badge>
            </Group>
            <Divider />
            {nearby.isLoading && <Loader size="sm" />}
            {nearby.isError && (
              <Text size="sm" c="red">
                Failed to load nearby hospitals.
              </Text>
            )}
            {nearby.data && nearby.data.length === 0 && (
              <Text size="sm" c="dimmed">
                No nearby hospitals found.
              </Text>
            )}
            {nearby.data && nearby.data.length > 0 && (
              <Table.ScrollContainer minWidth={640}>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Level</Table.Th>
                      <Table.Th>Ward</Table.Th>
                      <Table.Th>LGA</Table.Th>
                      <Table.Th>Distance</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {nearby.data.map((row) => (
                      <Table.Tr key={row.id}>
                        <Table.Td>
                          <Text
                            component={Link}
                            to={`/coding-concept/facilities/hospitals/${row.id}`}
                            size="sm"
                            fw={500}
                          >
                            {row.facilityName ?? '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>{refName(row.facilityLevel)}</Table.Td>
                        <Table.Td>{refName(row.ward)}</Table.Td>
                        <Table.Td>{refName(row.lga)}</Table.Td>
                        <Table.Td>{row.distanceKm} km</Table.Td>
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
