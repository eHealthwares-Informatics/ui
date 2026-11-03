import { Card, Group, Stack, Text, Title, Switch, Badge, Alert, Box } from '@mantine/core';
import { Info, Bell } from 'lucide-react';

type ToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  status: 'Subscribed' | 'Unsubscribed';
};

function Toggle({ label, description, checked, onChange, status }: ToggleProps) {
  return (
    <Group align="center" style={{ height: 56 }}>
      <Box>
        <Text fw={600} size="sm">
          {label}
        </Text>
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      </Box>
      <Switch
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        color="red"
        size="md"
        styles={{ track: { width: 44, height: 24 }, thumb: { width: 20, height: 20 } }}
      />
      <Badge size="xs" variant="filled" color="red">
        {status}
      </Badge>
    </Group>
  );
}

export function NotificationsSection() {
  return (
    <Card withBorder radius="md" p="lg" data-testid="account-notifications">
      <Stack gap="md">
        <Group align="center" gap="xs" wrap="nowrap">
          <Bell size={16} strokeWidth={1.5} />
          <Title order={3}>Notifications</Title>
        </Group>

        <Alert title="1 factor" icon={<Info size={16} strokeWidth={1.5} />} color="blue" mb="md">
          Each email switch stops its own email only. Notifications from alert rules you are a
          recipient of, and other transactional email about your account, are unaffected.
        </Alert>

        <Toggle
          label="Weekly digest"
          description="A Monday morning summary of every project you work on: traffic, error rate and p95 against the week before, new issues, the slowest operations — and if you pay for any of them, how much profit per project you actually kept."
          checked
          onChange={() => {}}
          status="Subscribed"
        />

        <Toggle
          label="New error emails"
          description="An email when one of your projects reports an error it has never seen before. At most a few a day per project."
          checked
          onChange={() => {}}
          status="Subscribed"
        />
      </Stack>
    </Card>
  );
}
