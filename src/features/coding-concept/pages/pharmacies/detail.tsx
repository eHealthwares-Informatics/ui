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

type LocalityRef = { id: string; code: string; name: string; type: string };

type Pharmacy = {
  id: string;
  premisesId: string;
  premisesName: string | null;
  premisesAddress: string | null;
  pharmacist: string | null;
  category: string | null;
  certificateNo: string | null;
  yearLicenced: string | null;
  state: { name: string } | null;
  lga: { name: string } | null;
  ward: { name: string } | null;
  areaLocality: LocalityRef | null;
  neighbourhoodLocality: LocalityRef | null;
  settlementLocality: LocalityRef | null;
  area: string | null;
  neighbourhood: string | null;
  settlement: string | null;
};

type NearbyPharmacy = Pharmacy & {
  nearbyTier: string | null;
  nearbyDistanceKm: number | null;
};

const TIER_LABEL: Record<string, string> = {
  area: 'Same area',
  ward: 'Same ward',
  lga: 'Same LGA',
  coord: 'Nearby',
};

function localityName(ref: LocalityRef | null, fallback: string | null) {
  return ref?.name ?? fallback ?? '—';
}

export function CodedPharmacyDetailPage({ pharmacyId }: { pharmacyId: string }) {
  const pharmacy = useQuery({
    queryKey: ['coding-concept', 'pharmacies', pharmacyId] satisfies QueryKey,
    queryFn: async () => {
      const response = await codingConceptApi.get(`/pharmacies/${pharmacyId}`);
      return response.data.data as Pharmacy;
    },
  });

  const nearby = useQuery({
    queryKey: ['coding-concept', 'pharmacies', pharmacyId, 'nearby'] satisfies QueryKey,
    queryFn: async () => {
      const response = await codingConceptApi.get(`/pharmacies/${pharmacyId}/nearby`, {
        params: { limit: 50 },
      });
      return response.data.data as NearbyPharmacy[];
    },
  });

  return (
    <RxPage
      title={pharmacy.data?.premisesName ?? 'Pharmacy'}
      description={pharmacy.data?.premisesAddress ?? pharmacy.data?.premisesId ?? ''}
    >
      <Stack gap="lg">
        <Card withBorder radius="lg" p="lg">
          {pharmacy.isLoading && <Loader size="sm" />}
          {pharmacy.isError && (
            <Text size="sm" c="red">
              Failed to load pharmacy.
            </Text>
          )}
          {pharmacy.data && (
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={3}>{pharmacy.data.premisesName ?? '—'}</Title>
                <Badge variant="light">{pharmacy.data.category ?? 'Uncategorised'}</Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {pharmacy.data.premisesId}
              </Text>
              <Divider />
              <Grid>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Pharmacist
                  </Text>
                  <Text fw={500}>{pharmacy.data.pharmacist ?? '—'}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Certificate
                  </Text>
                  <Text fw={500}>{pharmacy.data.certificateNo ?? '—'}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Year licenced
                  </Text>
                  <Text fw={500}>{pharmacy.data.yearLicenced ?? '—'}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    State
                  </Text>
                  <Text fw={500}>{pharmacy.data.state?.name ?? '—'}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    LGA
                  </Text>
                  <Text fw={500}>{pharmacy.data.lga?.name ?? '—'}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Ward
                  </Text>
                  <Text fw={500}>{pharmacy.data.ward?.name ?? '—'}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Area
                  </Text>
                  <Text fw={500}>
                    {localityName(pharmacy.data.areaLocality, pharmacy.data.area)}
                  </Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Neighbourhood
                  </Text>
                  <Text fw={500}>
                    {localityName(
                      pharmacy.data.neighbourhoodLocality,
                      pharmacy.data.neighbourhood,
                    )}
                  </Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Settlement
                  </Text>
                  <Text fw={500}>
                    {localityName(pharmacy.data.settlementLocality, pharmacy.data.settlement)}
                  </Text>
                </Grid.Col>
              </Grid>
            </Stack>
          )}
        </Card>

        <Card withBorder radius="lg" p="lg">
          <Stack gap="md">
            <Group gap="sm">
              <Title order={4}>Nearby pharmacies</Title>
              <Badge variant="light" color="gray">
                {nearby.data?.length ?? 0}
              </Badge>
            </Group>
            <Divider />
            {nearby.isLoading && <Loader size="sm" />}
            {nearby.isError && (
              <Text size="sm" c="red">
                Failed to load nearby pharmacies.
              </Text>
            )}
            {nearby.data && nearby.data.length === 0 && (
              <Text size="sm" c="dimmed">
                No nearby pharmacies found.
              </Text>
            )}
            {nearby.data && nearby.data.length > 0 && (
              <Table.ScrollContainer minWidth={720}>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Category</Table.Th>
                      <Table.Th>Ward</Table.Th>
                      <Table.Th>Proximity</Table.Th>
                      <Table.Th>Distance</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {nearby.data.map((row) => (
                      <Table.Tr key={row.id}>
                        <Table.Td>
                          <Text
                            component={Link}
                            to={`/coding-concept/facilities/pharmacies/${row.id}`}
                            size="sm"
                            fw={500}
                          >
                            {row.premisesName ?? '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>{row.category ?? '—'}</Table.Td>
                        <Table.Td>{row.ward?.name ?? '—'}</Table.Td>
                        <Table.Td>
                          {row.nearbyTier ? (TIER_LABEL[row.nearbyTier] ?? row.nearbyTier) : '—'}
                        </Table.Td>
                        <Table.Td>
                          {row.nearbyDistanceKm === null ? '—' : `${row.nearbyDistanceKm} km`}
                        </Table.Td>
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
