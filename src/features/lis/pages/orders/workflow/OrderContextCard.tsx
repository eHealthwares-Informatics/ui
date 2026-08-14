import { Badge, Card, Group, Progress, Stack, Text } from '@mantine/core';
import { useOrderContext } from './OrderContext';

export function OrderContextCard() {
  const { state } = useOrderContext();

  if (!state.orderNumber && !state.patientName) return null;

  const completedSteps = [state.stepProgress.enter, state.stepProgress.collect, state.stepProgress.label, state.stepProgress.qa, state.stepProgress.order].filter(Boolean).length;

  return (
    <Card withBorder p="sm" radius="md" bg="gray.0">
      <Group gap="lg" align="center">
        {state.orderNumber && (
          <Group gap="xs">
            <Text size="sm" fw={600}>
              Order:
            </Text>
            <Badge color="violet" variant="light">
              {state.orderNumber}
            </Badge>
          </Group>
        )}
        {state.patientName && (
          <Text size="sm" c="dimmed">
            Patient: <strong>{state.patientName}</strong>
          </Text>
        )}
        {state.patientId && (
          <Text size="sm" c="dimmed">
            MRN: {state.patientId}
          </Text>
        )}
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            Progress: {completedSteps}/5
          </Text>
          <Progress value={(completedSteps / 5) * 100} size="sm" w={120} color="violet" />
        </Stack>
      </Group>
    </Card>
  );
}
