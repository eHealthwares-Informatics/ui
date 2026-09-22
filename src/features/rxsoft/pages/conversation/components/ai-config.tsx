import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Card,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Brain } from 'lucide-react';
import { conversationApi } from '@/lib/conversation-api';

type AIConfig = {
  defaultRouting: string;
  defaultModel: { routing: string; model: string };
  requestTimeoutMs: number;
  maxRetries: number;
  retryStrategy: string;
  providers: Record<string, { configured: boolean }>;
};

export function RxAIConfigPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-config'],
    queryFn: async () => {
      const res = await conversationApi.get('/ai/config');
      return (res.data?.data ?? res.data) as AIConfig;
    },
  });

  if (isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader />
      </Stack>
    );
  }

  if (!data) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No AI configuration found.
      </Text>
    );
  }

  const providers = data.providers ?? {};

  return (
    <Stack gap="lg">
      <Group>
        <Brain size={24} />
        <div>
          <Title order={3}>AI Configuration</Title>
          <Text size="sm" c="dimmed">
            Current routing defaults and provider status. Models and API keys are
            managed under AI → Models.
          </Text>
        </div>
      </Group>

      <Card withBorder radius="md" p="lg">
        <Title order={4} mb="md">
          Routing Defaults
        </Title>
        <Grid>
          <Grid.Col span={4}>
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Default Routing
              </Text>
              <Badge variant="light" size="lg">
                {data.defaultRouting}
              </Badge>
            </Stack>
          </Grid.Col>
          <Grid.Col span={4}>
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Default Model
              </Text>
              <Badge variant="light" size="lg">
                {data.defaultModel?.model ?? '-'}
              </Badge>
            </Stack>
          </Grid.Col>
          <Grid.Col span={4}>
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Retry Strategy
              </Text>
              <Badge variant="light" size="lg">
                {data.retryStrategy}
              </Badge>
            </Stack>
          </Grid.Col>
          <Grid.Col span={4}>
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Request Timeout
              </Text>
              <Text fw={500}>{data.requestTimeoutMs}ms</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={4}>
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Max Retries
              </Text>
              <Text fw={500}>{data.maxRetries}</Text>
            </Stack>
          </Grid.Col>
        </Grid>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Title order={4} mb="md">
          Provider Status
        </Title>
        <Grid>
          {Object.entries(providers).map(([name, info]) => (
            <Grid.Col key={name} span={4}>
              <Group>
                <Badge
                  variant="light"
                  color={info.configured ? 'green' : 'gray'}
                  size="lg"
                >
                  {name}
                </Badge>
                <Text size="sm" c={info.configured ? 'green' : 'dimmed'}>
                  {info.configured ? 'Configured' : 'Not configured'}
                </Text>
              </Group>
            </Grid.Col>
          ))}
        </Grid>
      </Card>
    </Stack>
  );
}
