import { Card, Stack, Text, Title } from '@mantine/core';
import { CurrentSessionTimeline } from '@/features/identity/components/session-timeline';

/**
 * Account → Session: when the current browser session is silently renewed and
 * when it actually ends. Read from the tokens in hand, so it always matches the
 * session the user is signed into.
 */
export function SessionSection() {
  return (
    <Card withBorder radius="md" p="lg" data-testid="account-session">
      <Stack gap="md">
        <Stack gap={2}>
          <Title order={3}>Session</Title>
          <Text size="sm" c="dimmed">
            When this browser session will be renewed and when it ends.
          </Text>
        </Stack>
        <CurrentSessionTimeline />
      </Stack>
    </Card>
  );
}
