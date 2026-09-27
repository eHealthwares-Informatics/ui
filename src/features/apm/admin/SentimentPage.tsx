import {
  Box,
  Card,
  Grid,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
  Table,
  Progress,
} from '@mantine/core';
import { useSentimentDashboard } from '../website/admin-hooks';
import { apmBlue, apmGreen, ink, muted, accent } from '../website/layout';

export function SentimentPage() {
  const { data, isLoading } = useSentimentDashboard();

  if (isLoading) {
    return <Skeleton height={500} radius="md" />;
  }

  const statCards = [
    { label: 'Total Feedback', value: data?.total ?? 0, color: apmBlue },
    { label: 'Positive', value: data?.positive ?? 0, color: '#16A34A' },
    { label: 'Negative', value: data?.negative ?? 0, color: '#DC2626' },
    { label: 'Neutral', value: data?.neutral ?? 0, color: '#94A3B8' },
    {
      label: 'Sentiment Score',
      value: `${data?.sentimentScore ?? 0}%`,
      color: (data?.sentimentScore ?? 0) >= 0 ? '#16A34A' : '#DC2626',
    },
  ];

  return (
    <Stack gap="lg">
      <Title order={3} style={{ color: ink }}>
        Sentiment Analysis
      </Title>

      <Grid>
        {statCards.map((s) => (
          <Grid.Col key={s.label} span={{ base: 6, sm: 4, md: 2.4 }}>
            <Card padding="lg" radius="md" withBorder>
              <Stack gap={4} align="center">
                <Text size="sm" style={{ color: muted }}>
                  {s.label}
                </Text>
                <Text fw={800} style={{ fontSize: '1.5rem', color: s.color, lineHeight: 1.2 }}>
                  {s.value}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {data && data.total > 0 && (
        <Card padding="lg" radius="md" withBorder>
          <Text fw={700} mb="md" style={{ color: ink }}>
            Sentiment Distribution
          </Text>
          <Stack gap="md">
            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="sm" fw={600} style={{ color: '#16A34A' }}>
                  Positive
                </Text>
                <Text size="sm" style={{ color: muted }}>
                  {Math.round((data.positive / data.total) * 100)}%
                </Text>
              </Group>
              <Progress value={(data.positive / data.total) * 100} color="green" size="lg" />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="sm" fw={600} style={{ color: muted }}>
                  Neutral
                </Text>
                <Text size="sm" style={{ color: muted }}>
                  {Math.round((data.neutral / data.total) * 100)}%
                </Text>
              </Group>
              <Progress value={(data.neutral / data.total) * 100} color="gray" size="lg" />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="sm" fw={600} style={{ color: '#DC2626' }}>
                  Negative
                </Text>
                <Text size="sm" style={{ color: muted }}>
                  {Math.round((data.negative / data.total) * 100)}%
                </Text>
              </Group>
              <Progress value={(data.negative / data.total) * 100} color="red" size="lg" />
            </Box>
          </Stack>
        </Card>
      )}

      {data?.topicBreakdown && data.topicBreakdown.length > 0 && (
        <Card padding="lg" radius="md" withBorder>
          <Text fw={700} mb="md" style={{ color: ink }}>
            Topics
          </Text>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Topic</Table.Th>
                <Table.Th>Mentions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.topicBreakdown.map((t: any) => (
                <Table.Tr key={t.topic}>
                  <Table.Td fw={600}>{t.topic}</Table.Td>
                  <Table.Td>{t.count}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {data?.byLga && data.byLga.length > 0 && (
        <Card padding="lg" radius="md" withBorder>
          <Text fw={700} mb="md" style={{ color: ink }}>
            Sentiment by LGA
          </Text>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>LGA</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Positive</Table.Th>
                <Table.Th>Negative</Table.Th>
                <Table.Th>Neutral</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.byLga.map((l: any) => (
                <Table.Tr key={l.lga}>
                  <Table.Td fw={600}>{l.lga}</Table.Td>
                  <Table.Td>{l.total}</Table.Td>
                  <Table.Td>
                    <Text style={{ color: '#16A34A' }} fw={600}>
                      {l.positive}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text style={{ color: '#DC2626' }} fw={600}>
                      {l.negative}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ color: muted }}>{l.neutral}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}
